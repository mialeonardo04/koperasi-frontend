<template>
  <div class="simpanan-page">
    <!-- Saldo Cards -->
    <div class="grid-3" style="margin-bottom:1.5rem">
      <div class="stat-card" v-for="s in saldoCards" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <component :is="s.icon" :size="18" :style="{ color: s.color }" />
        </div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value money" :style="{ color: s.color }">
          <span v-if="loadingSaldo">...</span>
          <span v-else>{{ formatRupiah(saldo[s.key]) }}</span>
        </div>
      </div>
    </div>

    <div class="grid-2" style="align-items:start">
      <!-- Form Pengajuan -->
      <div class="card">
        <div class="tab-bar">
          <button class="tab" :class="{ active: tab === 'setor' }" @click="tab = 'setor'; resetForm()">
            <ArrowDownCircle :size="15" /> Setor
          </button>
          <button class="tab" :class="{ active: tab === 'tarik' }" @click="tab = 'tarik'; resetForm()">
            <ArrowUpCircle :size="15" /> Tarik
          </button>
          <button class="tab" :class="{ active: tab === 'pengajuan' }" @click="tab = 'pengajuan'; loadPengajuan()">
            <ClipboardList :size="15" /> Pengajuan
            <span class="notif-dot" v-if="jumlahPending > 0">{{ jumlahPending }}</span>
          </button>
        </div>

        <!-- Form Setor -->
        <form v-if="tab === 'setor'" @submit.prevent="submitPengajuan('setor')" class="transaksi-form">
          <div class="info-box">
            <Info :size="14" />
            <span>Pengajuan akan diproses setelah disetujui admin</span>
          </div>
          <div class="form-group">
            <label class="form-label">Jenis Simpanan</label>
            <select v-model="form.jenis" class="form-input form-select" required>
              <option value="">Pilih jenis...</option>
              <option value="POKOK">Simpanan Pokok</option>
              <option value="WAJIB">Simpanan Wajib</option>
              <option value="SUKARELA">Simpanan Sukarela</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jumlah (Rp)</label>
            <CurrencyInput v-model="form.jumlah" placeholder="0" :min="1000" :required="true" />
            <p class="form-hint">Minimal Rp 1.000</p>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan <span class="text-muted">(opsional)</span></label>
            <input v-model="form.keterangan" type="text" class="form-input" placeholder="Misal: Simpanan wajib Maret 2025" />
          </div>
          <div class="saldo-preview" v-if="form.jenis">
            <span class="text-muted text-sm">Saldo {{ form.jenis }}:</span>
            <span class="font-semibold money">{{ formatRupiah(currentSaldo) }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Bukti Pembayaran <span class="required-mark">*</span></label>
            <BuktiBayarUploader v-model="form.buktiBayar" />
            <p class="form-error" v-if="submitAttempted && !form.buktiBayar">
              ⚠️ Bukti pembayaran wajib diunggah sebelum mengajukan
            </p>
          </div>
          <button type="submit" class="btn btn-primary w-full"
            :disabled="submitting"
            :class="{ 'btn-disabled-hint': !form.buktiBayar }">
            <span class="spinner" v-if="submitting" />
            <span v-else><Send :size="14" /> Ajukan Setoran</span>
          </button>
        </form>

        <!-- Form Tarik -->
        <form v-if="tab === 'tarik'" @submit.prevent="submitPengajuan('tarik')" class="transaksi-form">
          <div class="info-box">
            <Info :size="14" />
            <span>Pengajuan akan diproses setelah disetujui admin</span>
          </div>
          <div class="form-group">
            <label class="form-label">Jenis Simpanan</label>
            <select v-model="form.jenis" class="form-input form-select" required>
              <option value="">Pilih jenis...</option>
              <option value="WAJIB">Simpanan Wajib</option>
              <option value="SUKARELA">Simpanan Sukarela</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Jumlah (Rp)</label>
            <CurrencyInput v-model="form.jumlah" placeholder="0" :min="1000" :required="true" />
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan <span class="text-muted">(opsional)</span></label>
            <input v-model="form.keterangan" type="text" class="form-input" />
          </div>
          <div class="saldo-preview" v-if="form.jenis">
            <span class="text-muted text-sm">Saldo tersedia:</span>
            <span class="font-semibold money">{{ formatRupiah(currentSaldo) }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Bukti Pembayaran <span class="required-mark">*</span></label>
            <BuktiBayarUploader v-model="form.buktiBayar" />
            <p class="form-error" v-if="submitAttempted && !form.buktiBayar">
              ⚠️ Bukti pembayaran wajib diunggah sebelum mengajukan
            </p>
          </div>
          <button type="submit" class="btn btn-danger w-full"
            :disabled="submitting"
            :class="{ 'btn-disabled-hint': !form.buktiBayar }">
            <span class="spinner" v-if="submitting" />
            <span v-else><Send :size="14" /> Ajukan Penarikan</span>
          </button>
        </form>

        <!-- Riwayat Pengajuan (per member) -->
        <div v-if="tab === 'pengajuan'">
          <div v-if="loadingPengajuan" class="loading-center"><div class="spinner"/></div>
          <div v-else-if="pengajuanList.length === 0" class="empty-state">
            <ClipboardList :size="36" style="opacity:0.3" />
            <p>Belum ada pengajuan</p>
          </div>
          <div v-else class="pengajuan-list">
            <div class="pengajuan-item" v-for="p in pengajuanList" :key="p.id">
              <div class="pengajuan-icon" :class="iconClass(p)">
                <ArrowDownCircle v-if="p.jenisTransaksi === 'SETOR_SIMPANAN'" :size="15" />
                <ArrowUpCircle   v-else-if="p.jenisTransaksi === 'TARIK_SIMPANAN'" :size="15" />
                <CreditCard      v-else :size="15" />
              </div>
              <div class="pengajuan-info">
                <div class="pengajuan-top">
                  <span class="pengajuan-label">{{ labelJenis(p) }}</span>
                  <span class="money font-semibold" v-if="p.jumlah">{{ formatRupiah(p.jumlah) }}</span>
                </div>
                <div class="pengajuan-bottom">
                  <span class="text-xs text-muted">{{ formatDateTime(p.createdAt) }}</span>
                  <span class="badge badge-sm" :class="statusPendingBadge(p.status).class">
                    {{ statusPendingBadge(p.status).label }}
                  </span>
                </div>
                <p class="text-xs text-muted" v-if="p.catatanAdmin" style="margin-top:3px">
                  📝 {{ p.catatanAdmin }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Riwayat Transaksi -->
      <div class="card">
        <div class="card-head">
          <h4>Riwayat Transaksi</h4>
          <span class="badge badge-neutral">{{ page.totalElements }} transaksi</span>
        </div>
        <div v-if="loadingRiwayat" class="loading-center"><div class="spinner" /></div>
        <div v-else-if="riwayat.length === 0" class="empty-state">
          <Wallet :size="36" style="opacity:0.3" />
          <p>Belum ada transaksi</p>
        </div>
        <div v-else class="riwayat-list">
          <div class="riwayat-item" v-for="r in riwayat" :key="r.id">
            <div class="riwayat-icon" :class="r.tipe === 'SETOR' ? 'icon-setor' : 'icon-tarik'">
              <ArrowDownCircle v-if="r.tipe==='SETOR'" :size="16" />
              <ArrowUpCircle   v-else :size="16" />
            </div>
            <div class="riwayat-info">
              <div class="riwayat-top">
                <span class="riwayat-jenis">{{ r.jenis }}</span>
                <span class="riwayat-amount money" :class="r.tipe==='SETOR' ? 'money-positive' : 'money-negative'">
                  {{ r.tipe === 'SETOR' ? '+' : '-' }}{{ formatRupiah(r.jumlah) }}
                </span>
              </div>
              <div class="riwayat-bottom">
                <span class="text-xs text-muted">{{ formatDateTime(r.tanggalTransaksi) }}</span>
                <span class="badge badge-sm" :class="jenisBadge(r.tipe).class">{{ r.tipe }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pagination" style="margin-top:1rem;justify-content:center" v-if="page.totalPages > 1">
          <button class="page-btn" :disabled="page.number === 0" @click="changePage(page.number - 1)">‹</button>
          <button v-for="p in page.totalPages" :key="p" class="page-btn" :class="{ active: page.number === p - 1 }" @click="changePage(p - 1)">{{ p }}</button>
          <button class="page-btn" :disabled="page.number >= page.totalPages - 1" @click="changePage(page.number + 1)">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, CreditCard, ClipboardList, Info, Send } from 'lucide-vue-next'
import BuktiBayarUploader from '@/components/BuktiBayarUploader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { simpananApi, pengajuanApi } from '@/services/api'
import { formatRupiah, formatDateTime, jenisBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const tab          = ref('setor')
const saldo        = ref({ simpananPokok: 0, simpananWajib: 0, simpananSukarela: 0, totalSimpanan: 0 })
const riwayat      = ref([])
const pengajuanList = ref([])
const loadingSaldo   = ref(true)
const loadingRiwayat = ref(true)
const loadingPengajuan = ref(false)
const submitting     = ref(false)
const page = ref({ number: 0, totalPages: 1, totalElements: 0 })
const form = ref({ jenis: '', jumlah: null, keterangan: '', buktiBayar: null })
const submitAttempted = ref(false)

const jumlahPending = computed(() =>
  pengajuanList.value.filter(p => p.status === 'PENDING').length
)

const saldoCards = [
  { key: 'simpananPokok',    label: 'Simpanan Pokok',    icon: PiggyBank,  color: 'var(--clr-primary)', bg: 'var(--clr-primary-light)' },
  { key: 'simpananWajib',    label: 'Simpanan Wajib',    icon: Wallet,     color: 'var(--clr-warning)', bg: 'var(--clr-accent-light)' },
  { key: 'simpananSukarela', label: 'Simpanan Sukarela', icon: CreditCard, color: 'var(--clr-info)',    bg: 'var(--clr-info-bg)' },
]

const currentSaldo = computed(() => {
  const map = { POKOK: 'simpananPokok', WAJIB: 'simpananWajib', SUKARELA: 'simpananSukarela' }
  return saldo.value[map[form.value.jenis]] || 0
})

function statusPendingBadge(status) {
  const map = {
    PENDING:   { label: 'Menunggu',  class: 'badge-warning' },
    DISETUJUI: { label: 'Disetujui', class: 'badge-success' },
    DITOLAK:   { label: 'Ditolak',   class: 'badge-danger' },
  }
  return map[status] || { label: status, class: 'badge-neutral' }
}

function labelJenis(p) {
  if (p.jenisTransaksi === 'SETOR_SIMPANAN') return `Setor ${p.jenisSimpanan}`
  if (p.jenisTransaksi === 'TARIK_SIMPANAN') return `Tarik ${p.jenisSimpanan}`
  if (p.jenisTransaksi === 'BAYAR_ANGSURAN') return `Bayar Angsuran ke-${p.periodeAngsuran}`
  return p.jenisTransaksi
}

function iconClass(p) {
  if (p.jenisTransaksi === 'SETOR_SIMPANAN') return 'icon-setor'
  if (p.jenisTransaksi === 'TARIK_SIMPANAN') return 'icon-tarik'
  return 'icon-angsuran'
}

async function loadSaldo() {
  loadingSaldo.value = true
  try { saldo.value = (await simpananApi.saldo()).data.data }
  finally { loadingSaldo.value = false }
}

async function loadRiwayat(p = 0) {
  loadingRiwayat.value = true
  try {
    const res = await simpananApi.riwayat({ page: p, size: 8, sort: 'tanggalTransaksi,desc' })
    const d   = parsePage(res.data.data)
    riwayat.value = d.content
    page.value    = { number: d.number, totalPages: d.totalPages, totalElements: d.totalElements }
  } finally { loadingRiwayat.value = false }
}

async function loadPengajuan() {
  loadingPengajuan.value = true
  try {
    const res = await pengajuanApi.riwayat({ page: 0, size: 30, sort: 'createdAt,desc' })
    pengajuanList.value = parsePage(res.data.data).content
  } finally { loadingPengajuan.value = false }
}

function resetForm() {
  form.value = { jenis: '', jumlah: null, keterangan: '', buktiBayar: null }
  submitAttempted.value = false
}

function changePage(p) { loadRiwayat(p) }

async function submitPengajuan(jenis) {
  submitAttempted.value = true
  if (!form.value.jenis || !form.value.jumlah) return
  if (!form.value.buktiBayar) {
    // scroll ke uploader agar user lihat pesan error
    return
  }
  submitting.value = true
  try {
    const payload = { jenisSimpanan: form.value.jenis, jumlah: form.value.jumlah, keterangan: form.value.keterangan, buktiBayar: form.value.buktiBayar }
    if (jenis === 'setor') {
      await pengajuanApi.ajukanSetor(payload)
      toast.success('Pengajuan setoran dikirim! Menunggu persetujuan admin.')
    } else {
      await pengajuanApi.ajukanTarik(payload)
      toast.success('Pengajuan penarikan dikirim! Menunggu persetujuan admin.')
    }
    form.value = { jenis: '', jumlah: null, keterangan: '', buktiBayar: null }
    submitAttempted.value = false
    tab.value  = 'pengajuan'
    await loadPengajuan()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengirim pengajuan')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadSaldo(); loadRiwayat(); loadPengajuan() })
</script>

<style scoped>
.tab-bar { display:flex; gap:6px; margin-bottom:1.25rem; background:var(--clr-surface-2); padding:4px; border-radius:var(--radius-md); }
.tab {
  flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
  padding:8px; border-radius:var(--radius-sm); font-size:0.875rem; font-weight:500;
  border:none; background:transparent; cursor:pointer; font-family:var(--font-sans);
  color:var(--clr-text-2); transition:all var(--transition); position:relative;
}
.tab.active { background:var(--clr-surface); color:var(--clr-text); box-shadow:var(--shadow-sm); }
.notif-dot {
  display:inline-flex; align-items:center; justify-content:center;
  background:var(--clr-danger); color:#fff; border-radius:99px;
  font-size:0.6rem; font-weight:700; min-width:16px; height:16px; padding:0 4px;
}
.info-box {
  display:flex; align-items:center; gap:8px;
  background:var(--clr-info-bg); color:var(--clr-info);
  border-radius:var(--radius-md); padding:10px 14px;
  font-size:0.8125rem; margin-bottom:4px;
}
.transaksi-form { display:flex; flex-direction:column; gap:1rem; }
.input-prefix-wrap { position:relative; }
.input-prefix { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); font-size:0.875rem; font-weight:500; pointer-events:none; }
.form-input.has-prefix { padding-left:38px; }
.form-hint { font-size:0.75rem; color:var(--clr-text-3); margin-top:2px; }
.saldo-preview { display:flex; justify-content:space-between; padding:10px 14px; background:var(--clr-surface-2); border-radius:var(--radius-md); }
.card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.loading-center { display:flex; justify-content:center; padding:2rem; }
/* Pengajuan list */
.pengajuan-list { display:flex; flex-direction:column; gap:2px; }
.pengajuan-item { display:flex; align-items:flex-start; gap:10px; padding:10px 8px; border-radius:var(--radius-md); transition:background var(--transition); }
.pengajuan-item:hover { background:var(--clr-bg); }
.pengajuan-icon { width:32px; height:32px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
.icon-setor    { background:var(--clr-success-bg); color:var(--clr-success); }
.icon-tarik    { background:var(--clr-danger-bg);  color:var(--clr-danger); }
.icon-angsuran { background:var(--clr-info-bg);    color:var(--clr-info); }
.pengajuan-info { flex:1; min-width:0; }
.pengajuan-top  { display:flex; justify-content:space-between; align-items:center; }
.pengajuan-label { font-size:0.875rem; font-weight:500; }
.pengajuan-bottom { display:flex; justify-content:space-between; align-items:center; margin-top:2px; }
/* Riwayat list */
.riwayat-list { display:flex; flex-direction:column; gap:2px; }
.riwayat-item { display:flex; align-items:center; gap:12px; padding:10px 8px; border-radius:var(--radius-md); transition:background var(--transition); }
.riwayat-item:hover { background:var(--clr-bg); }
.riwayat-icon { width:34px; height:34px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.riwayat-info { flex:1; min-width:0; }
.riwayat-top  { display:flex; justify-content:space-between; align-items:center; }
.riwayat-jenis  { font-size:0.875rem; font-weight:500; }
.riwayat-amount { font-size:0.9375rem; font-weight:600; }
.riwayat-bottom { display:flex; justify-content:space-between; align-items:center; margin-top:2px; }
.badge-sm { font-size:0.6875rem; padding:2px 7px; }
.required-mark { color:var(--clr-danger); font-weight:700; }
.form-error { font-size:0.8125rem; color:var(--clr-danger); margin-top:6px; background:var(--clr-danger-bg); padding:8px 12px; border-radius:var(--radius-md); }
.btn-disabled-hint { opacity:0.65; }
</style>