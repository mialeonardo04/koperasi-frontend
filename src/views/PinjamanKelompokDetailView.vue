<template>
  <div class="pinjaman-kelompok-detail">

    <div v-if="loading" class="loading-center"><div class="spinner" style="width:28px;height:28px"/></div>

    <template v-else-if="pinjaman">

      <!-- Header Info Pinjaman -->
      <div class="card header-card" style="margin-bottom:1.25rem">
        <div class="header-top">
          <div>
            <p class="mono-text text-xs text-muted">{{ pinjaman.noPinjaman }}</p>
            <h2 style="margin-top:4px">{{ pinjaman.tujuanPinjaman || 'Pinjaman Kelompok' }}</h2>
            <p class="text-sm text-muted" style="margin-top:4px">
              Kelompok: <strong>{{ pinjaman.namaKelompok }}</strong>
            </p>
          </div>
          <span class="badge badge-lg" :class="statusBadge(pinjaman.status).class">
            {{ statusBadge(pinjaman.status).label }}
          </span>
        </div>

        <!-- Stats grid -->
        <div class="stats-grid">
          <div class="stat-item">
            <span>Total Pinjaman</span>
            <strong class="money">{{ formatRupiah(pinjaman.jumlahPinjaman) }}</strong>
          </div>
          <div class="stat-item">
            <span>Sisa Pool</span>
            <strong class="money money-negative">{{ formatRupiah(pinjaman.sisaPool) }}</strong>
          </div>
          <div class="stat-item">
            <span>Total Tercairkan</span>
            <strong class="money">{{ formatRupiah(pinjaman.totalTercairkan) }}</strong>
          </div>
          <div class="stat-item">
            <span>Jatah/Anggota</span>
            <strong class="money">{{ formatRupiah(pinjaman.jatahRataPerAnggota) }}</strong>
          </div>
          <div class="stat-item">
            <span>Angsuran/Bulan</span>
            <strong class="money">{{ formatRupiah(pinjaman.angsuranPerBulan) }}</strong>
          </div>
          <div class="stat-item">
            <span>Tenor</span>
            <strong>{{ pinjaman.tenorBulan }} bulan</strong>
          </div>
          <div class="stat-item">
            <span>Jatuh Tempo</span>
            <strong>{{ formatDate(pinjaman.tanggalJatuhTempo) || '-' }}</strong>
          </div>
          <div class="stat-item">
            <span>Jumlah Anggota</span>
            <strong>{{ pinjaman.jumlahAnggota }} orang</strong>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="margin-top:1rem" v-if="pinjaman.status==='DISETUJUI'">
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--clr-text-3);margin-bottom:6px">
            <span>Angsuran terbayar</span>
            <span>{{ progressPersen }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="`width:${progressPersen}%`"/>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom:1.25rem">
        <button class="tab" :class="{active:tab==='angsuran'}" @click="tab='angsuran'">Jadwal Angsuran</button>
        <button class="tab" :class="{active:tab==='pencairan'}" @click="tab='pencairan'">
          Pencairan Dana
          <span v-if="pinjaman.pencairanPending > 0" class="badge-dot">{{ pinjaman.pencairanPending }}</span>
        </button>
      </div>

      <!-- Tab: Jadwal Angsuran -->
      <div v-if="tab==='angsuran'">
        <div class="card" style="padding:0">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Ke-</th><th>Jatuh Tempo</th><th>Total</th><th>Status</th><th>Dibayar Oleh</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                <tr v-for="a in pinjaman.jadwalAngsuran" :key="a.id" :class="{'row-terlambat':a.terlambat}">
                  <td class="font-medium">{{ a.periodeKe }}</td>
                  <td class="text-sm">{{ formatDate(a.tanggalJatuhTempo) }}</td>
                  <td class="money font-semibold">{{ formatRupiah(a.jumlahAngsuran) }}</td>
                  <td>
                    <span class="badge badge-sm" :class="statusAngsuranClass(a.status)">
                      {{ a.terlambat ? '⚠️ Terlambat' : statusAngsuranLabel(a.status) }}
                    </span>
                  </td>
                  <td class="text-sm">{{ a.dibayarOleh || '-' }}</td>
                  <td>
                    <span v-if="a.status==='SUDAH_BAYAR'" class="text-xs text-muted">✓ Lunas</span>
                    <span v-else-if="a.adaPendingBayar" class="badge badge-warning badge-sm">⏳ Menunggu</span>
                    <div v-else-if="pinjaman.status==='DISETUJUI'" style="display:flex;flex-direction:column;gap:6px;min-width:160px">
                      <select v-model="metodeBayar[a.id]" class="form-input form-select" style="font-size:0.75rem;padding:4px 8px">
                        <option value="TRANSFER">Transfer (Bukti)</option>
                        <option value="SIMPANAN">Dari Saldo Simpanan</option>
                      </select>
                      <BuktiBayarUploader v-if="(metodeBayar[a.id]||'TRANSFER')==='TRANSFER'" v-model="buktiBayar[a.id]" />
                      <button class="btn btn-primary btn-sm" :disabled="bayarLoading===a.id" @click="ajukanBayar(a)">
                        <span class="spinner" v-if="bayarLoading===a.id" style="width:12px;height:12px"/>
                        <span v-else>Bayar Angsuran</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Pencairan Dana -->
      <div v-if="tab==='pencairan'">
        <!-- Request pencairan baru -->
        <div class="card" style="margin-bottom:1rem" v-if="pinjaman.status==='DISETUJUI' && pinjaman.sisaPool > 0">
          <h4 style="margin-bottom:0.75rem">Cairkan Dana</h4>
          <div class="info-box" style="margin-bottom:1rem;font-size:0.8125rem">
            💡 Jatah rata Anda: <strong>{{ formatRupiah(pinjaman.jatahRataPerAnggota) }}</strong>.
            Sisa pool: <strong>{{ formatRupiah(pinjaman.sisaPool) }}</strong>.<br/>
            Ambil lebih dari jatah = wajib bayar minimal 1 angsuran & perlu persetujuan leader.
          </div>
          <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:180px;margin-bottom:0">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <label class="form-label" style="margin-bottom:0">Jumlah Pencairan</label>
                <div style="display:flex;gap:6px">
                  <button type="button" class="btn-quick" @click="pencairanForm.jumlah = parseFloat(pinjaman.jatahRataPerAnggota)">
                    Jatah Saya
                  </button>
                  <button type="button" class="btn-quick btn-quick-full" @click="pencairanForm.jumlah = parseFloat(pinjaman.sisaPool)">
                    Ambil Semua
                  </button>
                </div>
              </div>
              <CurrencyInput v-model="pencairanForm.jumlah" :max="parseFloat(pinjaman.sisaPool)" placeholder="Masukkan jumlah..." />
            </div>
            <div class="form-group" style="flex:2;min-width:200px;margin-bottom:0">
              <label class="form-label">Catatan <span class="text-muted">(opsional)</span></label>
              <input v-model="pencairanForm.catatan" type="text" class="form-input" placeholder="Alasan pencairan..." />
            </div>
            <button class="btn btn-primary" :disabled="pencairanLoading || !pencairanForm.jumlah" @click="submitPencairan">
              <span class="spinner" v-if="pencairanLoading" style="width:14px;height:14px;border-width:2px"/>
              <span v-else>Ajukan Pencairan</span>
            </button>
          </div>
          <!-- Warning jika melebihi jatah -->
          <div class="warning-box" v-if="pencairanForm.jumlah && pencairanForm.jumlah > pinjaman.jatahRataPerAnggota" style="margin-top:0.75rem">
            ⚠️ Jumlah melebihi jatah rata — perlu persetujuan leader & Anda wajib membayar minimal 1x angsuran.
          </div>
        </div>

        <!-- Request pencairan pending (hanya leader) -->
        <div class="card" v-if="isLeader && pencairanPending.length" style="margin-bottom:1rem">
          <h4 style="margin-bottom:0.75rem">⏳ Request Pencairan Menunggu Persetujuan</h4>
          <div class="pencairan-list">
            <div class="pencairan-item pencairan-pending" v-for="p in pencairanPending" :key="p.id">
              <div class="pencairan-info">
                <strong>{{ p.namaAnggota }}</strong>
                <span class="money font-semibold" style="margin-left:8px">{{ formatRupiah(p.jumlah) }}</span>
                <span v-if="p.melebihiJatah" class="badge badge-warning badge-sm" style="margin-left:6px">Melebihi Jatah</span>
                <p class="text-xs text-muted" style="margin-top:2px">{{ p.catatan || '-' }}</p>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-danger btn-sm" :disabled="prosesLoading===p.id" @click="prosesPencairan(p.id, false)">Tolak</button>
                <button class="btn btn-success btn-sm" :disabled="prosesLoading===p.id" @click="prosesPencairan(p.id, true)">Setujui</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Riwayat pencairan -->
        <div class="card" style="padding:0">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Anggota</th><th>Jumlah</th><th>Jatah Rata</th><th>Status</th><th>Keterangan</th><th>Waktu</th></tr>
              </thead>
              <tbody>
                <tr v-if="riwayatPencairan.length===0">
                  <td colspan="6" class="text-center text-muted text-sm" style="padding:2rem">Belum ada pencairan</td>
                </tr>
                <tr v-for="p in riwayatPencairan" :key="p.id">
                  <td class="font-medium">{{ p.namaAnggota }}</td>
                  <td class="money font-semibold">{{ formatRupiah(p.jumlah) }}</td>
                  <td class="money text-muted">{{ formatRupiah(p.jatahRata) }}</td>
                  <td>
                    <span class="badge badge-sm" :class="statusPencairanClass(p.status)">{{ p.status }}</span>
                    <span v-if="p.wajibBayarAngsuran" class="badge badge-warning badge-sm" style="margin-left:4px">Wajib Bayar</span>
                  </td>
                  <td class="text-sm text-muted">{{ p.catatan || '-' }}</td>
                  <td class="text-xs text-muted">{{ formatDateTime(p.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-card card">
      <p class="text-muted">Pinjaman kelompok tidak ditemukan.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { kelompokApi } from '@/services/api'
import { formatRupiah, formatDate, formatDateTime, statusBadge } from '@/services/helpers'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'
import BuktiBayarUploader from '@/components/BuktiBayarUploader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const route   = useRoute()
const auth    = useAuthStore()
const pinjaman = ref(null)
const loading  = ref(true)
const tab      = ref('angsuran')

const metodeBayar   = ref({})
const buktiBayar    = ref({})
const bayarLoading  = ref(null)

const pencairanForm    = ref({ jumlah: null, catatan: '' })
const pencairanLoading = ref(false)
const pencairanPending = ref([])
const riwayatPencairan = ref([])
const prosesLoading    = ref(null)

const isLeaderRef = ref(false)
const isLeader    = computed(() => isLeaderRef.value)

const progressPersen = computed(() => {
  if (!pinjaman.value?.jumlahPinjaman || !pinjaman.value?.totalSudahDibayar) return 0
  return Math.min(100, Math.round(
    (Number(pinjaman.value.totalSudahDibayar) / Number(pinjaman.value.jumlahPinjaman)) * 100
  ))
})

function statusAngsuranClass(s) {
  return { BELUM_BAYAR:'badge-warning', SUDAH_BAYAR:'badge-success', TERLAMBAT:'badge-danger' }[s] || ''
}
function statusAngsuranLabel(s) {
  return { BELUM_BAYAR:'Belum Bayar', SUDAH_BAYAR:'Sudah Bayar', TERLAMBAT:'Terlambat' }[s] || s
}
function statusPencairanClass(s) {
  return { PENDING:'badge-warning', DISETUJUI:'badge-success', DITOLAK:'badge-danger' }[s] || ''
}

async function load() {
  loading.value = true
  try {
    // Step 1: Ambil kelompok saya untuk dapat pinjamanAktif.id
    const resKelompok = await kelompokApi.saya()
    const kelompok    = resKelompok.data.data
    if (!kelompok?.pinjamanAktif?.id) { loading.value = false; return }

    // Step 2: Fetch pinjaman detail langsung by ID — ini pastikan jadwal angsuran ter-load
    const resPinjaman = await kelompokApi.pinjamanDetail(kelompok.pinjamanAktif.id)
    pinjaman.value    = resPinjaman.data.data

    // Step 3: Simpan info leader dari kelompok
    isLeaderRef.value = kelompok.leaderId === auth.user?.id

    // Step 4: Load riwayat pencairan
    if (pinjaman.value) {
      try {
        const rp = await kelompokApi.riwayatPencairan(pinjaman.value.id)
        riwayatPencairan.value = rp.data.data
      } catch {}

      // Step 5: Leader load pending pencairan
      if (isLeaderRef.value) {
        try {
          const pp = await kelompokApi.pencairanPending(kelompok.id)
          pencairanPending.value = pp.data.data
        } catch {}
      }
    }
  } catch { pinjaman.value = null }
  finally { loading.value = false }
}

async function ajukanBayar(a) {
  const metode = metodeBayar.value[a.id] || 'TRANSFER'
  if (metode === 'TRANSFER' && !buktiBayar.value[a.id]) {
    toast.error('Upload bukti transfer terlebih dahulu'); return
  }
  bayarLoading.value = a.id
  try {
    await kelompokApi.bayarAngsuran({
      angsuranId: a.id, metodeBayar: metode,
      buktiBayar: buktiBayar.value[a.id] || null
    })
    toast.success(`Pengajuan bayar angsuran ke-${a.periodeKe} dikirim!`)
    await load()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal mengajukan pembayaran')
  } finally { bayarLoading.value = null }
}

async function submitPencairan() {
  if (!pencairanForm.value.jumlah) return
  pencairanLoading.value = true
  try {
    await kelompokApi.requestPencairan(pinjaman.value.id, pencairanForm.value)
    toast.success('Request pencairan berhasil dikirim ke leader!')
    pencairanForm.value = { jumlah: null, catatan: '' }
    await load()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal request pencairan')
  } finally { pencairanLoading.value = false }
}

async function prosesPencairan(pencairanId, disetujui) {
  prosesLoading.value = pencairanId
  try {
    await kelompokApi.prosesPencairan(pencairanId, { disetujui, catatan: '' })
    toast.success(disetujui ? 'Pencairan disetujui!' : 'Pencairan ditolak')
    await load()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal proses pencairan')
  } finally { prosesLoading.value = null }
}

onMounted(load)
</script>

<style scoped>
.header-card .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:12px; background:var(--clr-surface-2); border-radius:var(--radius-md); padding:14px; }
.stat-item { display:flex; flex-direction:column; gap:3px; }
.stat-item span { font-size:0.75rem; color:var(--clr-text-3); }
.progress-bar { height:8px; background:var(--clr-surface-2); border-radius:var(--radius-full); overflow:hidden; }
.progress-fill { height:100%; background:var(--clr-primary); border-radius:var(--radius-full); transition:width 0.4s ease; }
.tabs { display:flex; gap:4px; border-bottom:2px solid var(--clr-border); }
.tab { background:none; border:none; padding:10px 20px; font-size:0.9375rem; cursor:pointer; color:var(--clr-text-3); position:relative; transition:color var(--transition); }
.tab.active { color:var(--clr-primary); font-weight:600; }
.tab.active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:var(--clr-primary); border-radius:2px; }
.badge-dot { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:var(--clr-danger); color:#fff; font-size:0.6875rem; font-weight:700; margin-left:6px; }
.pencairan-list { display:flex; flex-direction:column; gap:10px; }
.pencairan-item { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px; border-radius:var(--radius-md); }
.pencairan-pending { background:var(--clr-accent-light); border:1px solid rgba(180,120,0,0.2); }
.row-terlambat td { background:rgba(220,38,38,0.04); }
.btn-quick { font-size:0.7rem; padding:3px 10px; border-radius:var(--radius-full); border:1px solid var(--clr-border); background:var(--clr-surface-2); color:var(--clr-text-2); cursor:pointer; transition:all var(--transition); font-weight:500; }
.btn-quick:hover { background:var(--clr-primary); color:#fff; border-color:var(--clr-primary); }
.btn-quick-full { border-color:var(--clr-primary); color:var(--clr-primary); }
.btn-quick-full:hover { background:var(--clr-primary); color:#fff; }
.warning-box { background:var(--clr-accent-light); border:1px solid rgba(180,120,0,0.25); border-radius:var(--radius-md); padding:10px 14px; font-size:0.8125rem; color:#92400e; }
.empty-card { text-align:center; padding:3rem; }
.btn-success { background:var(--clr-success); color:#fff; border:none; }
.btn-success:hover { opacity:0.88; }
.loading-center { display:flex; justify-content:center; padding:3rem; }
</style>