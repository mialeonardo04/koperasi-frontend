<template>
  <div>
    <div class="back-btn" @click="router.back()">
      <ArrowLeft :size="16" /> Kembali
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner" style="width:28px;height:28px;border-width:3px"/></div>

    <!-- Error state -->
    <div v-else-if="loadError" class="error-state card">
      <p style="color:var(--clr-danger);font-weight:600">Gagal memuat data pinjaman</p>
      <p class="text-sm text-muted" style="margin-top:4px">Periksa koneksi dan coba lagi</p>
      <button class="btn btn-primary btn-sm" style="margin-top:1rem" @click="loadError=false; load()">Coba Lagi</button>
    </div>

    <template v-else-if="pinjaman">
      <!-- Header card -->
      <div class="detail-header card" style="margin-bottom:1.25rem">
        <div class="dh-top">
          <div>
            <p class="text-xs text-muted" style="font-family:var(--font-mono)">{{ pinjaman.noPinjaman }}</p>
            <h3 style="margin-top:4px">{{ pinjaman.tujuanPinjaman || 'Pinjaman' }}</h3>
          </div>
          <span class="badge" :class="statusBadge(pinjaman.status).class" style="font-size:0.8125rem;padding:5px 12px">
            {{ statusBadge(pinjaman.status).label }}
          </span>
        </div>
        <div class="dh-grid">
          <div class="dh-stat">
            <span class="text-xs text-muted">Jumlah Pinjaman</span>
            <span class="font-semibold money">{{ formatRupiah(pinjaman.jumlahPinjaman) }}</span>
          </div>
          <div class="dh-stat">
            <span class="text-xs text-muted">Sisa Pinjaman</span>
            <span class="font-semibold money money-negative">{{ formatRupiah(pinjaman.sisaPinjaman) }}</span>
          </div>
          <div class="dh-stat">
            <span class="text-xs text-muted">Bunga/bulan</span>
            <span class="font-semibold">{{ pinjaman.bungaPerBulan }}%</span>
          </div>
          <div class="dh-stat">
            <span class="text-xs text-muted">Angsuran/bulan</span>
            <span class="font-semibold money">{{ formatRupiah(pinjaman.angsuranPerBulan) }}</span>
          </div>
          <div class="dh-stat">
            <span class="text-xs text-muted">Tenor</span>
            <span class="font-semibold">{{ pinjaman.tenorBulan }} bulan</span>
          </div>
          <div class="dh-stat">
            <span class="text-xs text-muted">Tanggal Diajukan</span>
            <span class="font-semibold">{{ formatDate(pinjaman.tanggalPengajuan) }}</span>
          </div>
        </div>

        <div class="progress-section" v-if="pinjaman.status === 'DISETUJUI' || pinjaman.status === 'LUNAS'">
          <div class="progress-labels">
            <span class="text-xs text-muted">Progress Pembayaran</span>
            <span class="text-xs font-semibold">{{ progressPct.toFixed(0) }}%</span>
          </div>
          <div class="progress-bar-lg">
            <div class="progress-fill-lg" :style="{ width: progressPct + '%' }" />
          </div>
          <div class="progress-sub">
            <span>Terbayar: <strong class="money">{{ formatRupiah(pinjaman.totalSudahDibayar) }}</strong></span>
            <span>Sisa: <strong class="money money-negative">{{ formatRupiah(pinjaman.sisaPinjaman) }}</strong></span>
          </div>
        </div>

        <div class="keterangan-admin" v-if="pinjaman.keteranganAdmin">
          <Info :size="14" />
          <span>{{ pinjaman.keteranganAdmin }}</span>
        </div>
      </div>

      <!-- Jadwal angsuran -->
      <div class="card" v-if="jadwal.length > 0">
        <h4 style="margin-bottom:1rem">Jadwal Angsuran</h4>

        <!-- Info approval -->
        <div class="info-box" style="margin-bottom:1rem">
          <Info :size="14" />
          <span>Pembayaran angsuran memerlukan persetujuan admin. Klik <strong>Ajukan</strong> untuk mengirim permintaan.</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ke-</th>
                <th>Jatuh Tempo</th>
                <th>Pokok</th>
                <th>Bunga</th>
                <th>Total</th>
                <th>Tgl Bayar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in jadwal" :key="a.id" :class="{ 'row-terlambat': isTerlambat(a) }">
                <td class="font-medium">{{ a.periodeKe }}</td>
                <td>{{ formatDate(a.tanggalJatuhTempo) }}</td>
                <td class="money">{{ formatRupiah(a.pokok) }}</td>
                <td class="money">{{ formatRupiah(a.bunga) }}</td>
                <td class="money font-semibold">{{ formatRupiah(a.jumlahAngsuran) }}</td>
                <td>{{ a.tanggalBayar ? formatDate(a.tanggalBayar) : '-' }}</td>
                <td>
                  <span class="badge" :class="statusBadge(a.status).class">{{ statusBadge(a.status).label }}</span>
                </td>
                <td>
                  <!-- Sudah lunas -->
                  <span v-if="a.status === 'SUDAH_BAYAR'" class="text-xs text-muted">✓ Lunas</span>

                  <!-- Ada pengajuan pending untuk angsuran ini -->
                  <span v-else-if="hasPendingBayar(a.id)" class="badge badge-warning" style="font-size:0.7rem">
                    ⏳ Menunggu
                  </span>

                  <!-- Tombol ajukan — tampil jika pinjaman aktif/lunas tapi masih ada angsuran belum bayar -->
                  <div v-else-if="pinjaman.status === 'DISETUJUI' || pinjaman.status === 'LUNAS'" style="display:flex;flex-direction:column;gap:4px;min-width:160px">
                    <BuktiBayarUploader v-model="buktiBayarMap[a.id]" />
                    <p class="bukti-required-msg" v-if="ajukanAttempted[a.id] && !buktiBayarMap[a.id]">
                      ⚠️ Bukti wajib diunggah
                    </p>
                    <button
                      class="btn btn-primary btn-sm"
                      :disabled="ajukanLoading === a.id"
                      :class="{ 'btn-disabled-hint': !buktiBayarMap[a.id] }"
                      @click="ajukanBayar(a)"
                    >
                    <span class="spinner" v-if="ajukanLoading === a.id" style="width:12px;height:12px" />
                    <span v-else><Send :size="12" /> Ajukan</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Riwayat pengajuan angsuran -->
        <div v-if="pengajuanAngsuran.length > 0" style="margin-top:1.25rem">
          <h5 style="margin-bottom:0.75rem;color:var(--clr-text-2)">Riwayat Pengajuan Bayar Angsuran</h5>
          <div class="pengajuan-mini-list">
            <div class="pengajuan-mini-item" v-for="p in pengajuanAngsuran" :key="p.id">
              <div>
                <span class="text-sm font-medium">Angsuran ke-{{ p.periodeAngsuran }}</span>
                <span class="text-xs text-muted" style="margin-left:8px">{{ formatDateTime(p.createdAt) }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="money text-sm">{{ formatRupiah(p.jumlah) }}</span>
                <span class="badge badge-sm" :class="statusPendingBadge(p.status).class">
                  {{ statusPendingBadge(p.status).label }}
                </span>
              </div>
              <p class="text-xs text-muted" v-if="p.catatanAdmin">📝 {{ p.catatanAdmin }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Info, Send } from 'lucide-vue-next'
import BuktiBayarUploader from '@/components/BuktiBayarUploader.vue'
import { pinjamanApi, pengajuanApi } from '@/services/api'
import { formatRupiah, formatDate, formatDateTime, statusBadge } from '@/services/helpers'
import { toast } from 'vue3-toastify'
import dayjs from 'dayjs'

const route   = useRoute()
const router  = useRouter()
const pinjaman     = ref(null)
const jadwal       = ref([])
const pengajuanAngsuran = ref([])
const loading      = ref(true)
const loadError    = ref(false)
const ajukanLoading  = ref(null)
const buktiBayarMap  = ref({}) // { angsuranId: pathBukti }
const ajukanAttempted = ref({}) // { angsuranId: boolean }

const progressPct = computed(() => {
  if (!pinjaman.value?.jumlahPinjaman) return 0
  return Math.min(100, (pinjaman.value.totalSudahDibayar / pinjaman.value.jumlahPinjaman) * 100)
})

function isTerlambat(a) {
  return a.status === 'BELUM_BAYAR' && dayjs().isAfter(dayjs(a.tanggalJatuhTempo))
}

// Cek apakah angsuran ini sedang dalam proses pengajuan
function hasPendingBayar(angsuranId) {
  return pengajuanAngsuran.value.some(
    p => p.angsuranId === angsuranId && p.status === 'PENDING'
  )
}

function statusPendingBadge(status) {
  const map = {
    PENDING:   { label: 'Menunggu',  class: 'badge-warning' },
    DISETUJUI: { label: 'Disetujui', class: 'badge-success' },
    DITOLAK:   { label: 'Ditolak',   class: 'badge-danger' },
  }
  return map[status] || { label: status, class: 'badge-neutral' }
}

async function load() {
  const pinjamanId = route.params.id
  if (!pinjamanId || pinjamanId === 'undefined' || pinjamanId === 'null') {
    console.warn('[PinjamanDetail] ID tidak valid:', pinjamanId)
    loading.value = false
    return
  }
  loading.value = true
  try {
    // Fetch data pinjaman utama — wajib berhasil
    const pd = await pinjamanApi.detail(pinjamanId)
    pinjaman.value = pd.data.data

    // Fetch jadwal & pengajuan secara terpisah agar tidak memblokir tampilan utama
    const [jd, pg] = await Promise.allSettled([
      pinjamanApi.jadwal(pinjamanId),
      pengajuanApi.riwayat({ page: 0, size: 50 }),
    ])

    // Jadwal angsuran — opsional, kosong jika pinjaman belum disetujui
    if (jd.status === 'fulfilled') {
      jadwal.value = jd.value.data.data ?? []
    } else {
      jadwal.value = []
      console.warn('[PinjamanDetail] Gagal load jadwal:', jd.reason)
    }

    // Riwayat pengajuan — opsional, tampilkan tetap meski gagal
    if (pg.status === 'fulfilled') {
      const noPinjaman = pinjaman.value.noPinjaman
      pengajuanAngsuran.value = (pg.value.data.data?.content ?? []).filter(
        p => p.jenisTransaksi === 'BAYAR_ANGSURAN' && p.noPinjaman === noPinjaman
      )
    } else {
      pengajuanAngsuran.value = []
      console.warn('[PinjamanDetail] Gagal load pengajuan:', pg.reason)
    }
  } catch (e) {
    console.error('[PinjamanDetail] Error load pinjaman:', e)
    toast.error('Gagal memuat detail pinjaman')
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function ajukanBayar(a) {
  // Tandai sudah mencoba submit untuk angsuran ini
  ajukanAttempted.value = { ...ajukanAttempted.value, [a.id]: true }

  // Validasi bukti wajib
  if (!buktiBayarMap.value[a.id]) {
    return
  }

  ajukanLoading.value = a.id
  try {
    await pengajuanApi.ajukanBayarAngsuran({ angsuranId: a.id, buktiBayar: buktiBayarMap.value[a.id] || null })
    toast.success(`Pengajuan bayar angsuran ke-${a.periodeKe} dikirim! Menunggu persetujuan admin.`)
    // Reset state untuk angsuran ini
    ajukanAttempted.value = { ...ajukanAttempted.value, [a.id]: false }
    await load()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengirim pengajuan')
  } finally {
    ajukanLoading.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.back-btn { display:inline-flex; align-items:center; gap:6px; color:var(--clr-text-2); font-size:0.875rem; cursor:pointer; margin-bottom:1.25rem; transition:color var(--transition); }
.back-btn:hover { color:var(--clr-text); }
.loading-state { display:flex; justify-content:center; padding:3rem; }
.error-state { text-align:center; padding:2.5rem 1.5rem; }
.dh-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
.dh-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.25rem; }
@media (max-width:600px) { .dh-grid { grid-template-columns:repeat(2,1fr); } }
.dh-stat { display:flex; flex-direction:column; gap:3px; }
.progress-section { margin-bottom:1rem; }
.progress-labels { display:flex; justify-content:space-between; margin-bottom:6px; }
.progress-bar-lg { height:8px; background:var(--clr-surface-2); border-radius:99px; overflow:hidden; }
.progress-fill-lg { height:100%; background:linear-gradient(90deg,var(--clr-primary),var(--clr-primary-mid)); border-radius:99px; transition:width 0.5s ease; }
.progress-sub { display:flex; justify-content:space-between; margin-top:6px; font-size:0.75rem; color:var(--clr-text-3); }
.keterangan-admin { display:flex; align-items:flex-start; gap:8px; background:var(--clr-info-bg); color:var(--clr-info); border-radius:var(--radius-md); padding:10px 14px; font-size:0.875rem; }
.row-terlambat td { background:rgba(192,57,43,0.04) !important; }
.info-box { display:flex; align-items:center; gap:8px; background:var(--clr-info-bg); color:var(--clr-info); border-radius:var(--radius-md); padding:10px 14px; font-size:0.8125rem; }
.pengajuan-mini-list { display:flex; flex-direction:column; gap:6px; }
.pengajuan-mini-item { background:var(--clr-surface-2); border:1px solid var(--clr-border); border-radius:var(--radius-md); padding:10px 14px; display:flex; flex-direction:column; gap:4px; }
.badge-sm { font-size:0.6875rem; padding:2px 7px; }
.bukti-required-msg { font-size:0.75rem; color:var(--clr-danger); background:var(--clr-danger-bg); padding:5px 8px; border-radius:var(--radius-sm); }
.btn-disabled-hint { opacity:0.65; }
</style>