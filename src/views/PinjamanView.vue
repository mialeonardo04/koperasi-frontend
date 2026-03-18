<template>
  <div class="pinjaman-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h3>Pinjaman Saya</h3>
        <p class="text-muted text-sm">Riwayat dan pengajuan pinjaman</p>
      </div>

    </div>

    <!-- Banner Pinjaman Kelompok -->
    <div class="card kelompok-banner" v-if="pinjamanKelompok" style="margin-bottom:1.25rem">
      <div class="kb-left">
        <div class="kb-icon"><Users :size="22" style="color:var(--clr-primary)"/></div>
        <div>
          <p class="text-xs text-muted" style="margin-bottom:2px">Pinjaman Kelompok Aktif</p>
          <h4>{{ pinjamanKelompok.namaKelompok }}</h4>
          <div style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap">
            <span class="text-sm">Total: <strong class="money">{{ formatRupiah(pinjamanKelompok.jumlahPinjaman) }}</strong></span>
            <span class="text-sm">Angsuran/bln: <strong class="money">{{ formatRupiah(pinjamanKelompok.angsuranPerBulan) }}</strong></span>
            <span class="badge badge-sm" :class="statusBadge(pinjamanKelompok.status).class">{{ statusBadge(pinjamanKelompok.status).label }}</span>
          </div>
        </div>
      </div>
      <router-link to="/pinjaman/kelompok" class="btn btn-primary btn-sm">Lihat Detail →</router-link>
    </div>

    <!-- List pinjaman individu (hanya tampil jika tidak ada pinjaman kelompok aktif) -->
    <template v-if="!pinjamanKelompok">
    <div v-if="loading" class="loading-state"><div class="spinner" style="width:28px;height:28px;border-width:3px"/></div>
    <div v-else-if="pinjaman.length === 0" class="empty-state card">
      <Banknote :size="40" style="opacity:0.25" />
      <p>Belum ada riwayat pinjaman</p>
      <div class="kelompok-info-box">
        <span>💡 Pengajuan pinjaman dilakukan melalui <strong>Kelompok</strong>.</span>
        <router-link to="/kelompok" class="kelompok-link">Buka Menu Kelompok →</router-link>
      </div>
    </div>
    <div v-else class="pinjaman-list">
      <div class="pinjaman-card" v-for="p in pinjaman" :key="p.id" @click="goDetail(p.id)">
        <div class="pinjaman-card-header">
          <div>
            <p class="pinjaman-no">{{ p.noPinjaman }}</p>
            <p class="pinjaman-tujuan">{{ p.tujuanPinjaman || 'Tidak ada keterangan' }}</p>
          </div>
          <span class="badge" :class="statusBadge(p.status).class">{{ statusBadge(p.status).label }}</span>
        </div>
        <div class="pinjaman-card-body">
          <div class="pinjaman-stat">
            <span class="text-muted text-xs">Jumlah Pinjaman</span>
            <span class="font-semibold money">{{ formatRupiah(p.jumlahPinjaman) }}</span>
          </div>
          <div class="pinjaman-stat">
            <span class="text-muted text-xs">Sisa Pinjaman</span>
            <span class="font-semibold money money-negative">{{ formatRupiah(p.sisaPinjaman) }}</span>
          </div>
          <div class="pinjaman-stat">
            <span class="text-muted text-xs">Angsuran/bulan</span>
            <span class="font-semibold money">{{ formatRupiah(p.angsuranPerBulan) }}</span>
          </div>
          <div class="pinjaman-stat">
            <span class="text-muted text-xs">Tenor</span>
            <span class="font-semibold">{{ p.tenorBulan }} bulan</span>
          </div>
        </div>
        <div class="pinjaman-card-footer" v-if="p.status === 'DISETUJUI'">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPct(p) + '%' }" />
          </div>
          <span class="text-xs text-muted">{{ progressPct(p).toFixed(0) }}% terbayar</span>
        </div>
        <div class="pinjaman-date">
          <Calendar :size="13" />
          <span>Diajukan {{ formatDate(p.tanggalPengajuan) }}</span>
          <span v-if="p.tanggalJatuhTempo"> · Jatuh tempo {{ formatDate(p.tanggalJatuhTempo) }}</span>
        </div>
      </div>
    </div>

    </template><!-- /v-if !pinjamanKelompok -->

    <!-- Modal Ajukan Pinjaman -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showAjukan" @click.self="showAjukan = false">
        <div class="modal">
          <div class="modal-header">
            <h3>Ajukan Pinjaman</h3>
            <button class="btn-icon-close" @click="showAjukan = false"><X :size="18" /></button>
          </div>

          <form @submit.prevent="submitAjukan">
            <div class="form-group">
              <label class="form-label">Jumlah Pinjaman</label>
              <CurrencyInput v-model="ajukanForm.jumlahPinjaman" placeholder="0" :min="500000" :required="true" />
              <p class="form-hint">Minimal Rp 500.000</p>
            </div>
            <div class="form-group">
              <label class="form-label">Tenor (bulan)</label>
              <select v-model.number="ajukanForm.tenorBulan" class="form-input form-select" required>
                <option v-for="t in tenorOptions" :key="t" :value="t">{{ t }} bulan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tujuan Pinjaman</label>
              <input v-model="ajukanForm.tujuanPinjaman" type="text" class="form-input" placeholder="Misal: Modal usaha, Renovasi rumah..." />
            </div>

            <!-- Estimasi angsuran -->
            <div class="estimasi-box" v-if="ajukanForm.jumlahPinjaman && ajukanForm.tenorBulan">
              <p class="text-xs text-muted" style="margin-bottom:6px">Estimasi angsuran (bunga 1,5%/bulan)</p>
              <p class="estimasi-val money">≈ {{ formatRupiah(estimasiAngsuran) }} / bulan</p>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showAjukan = false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingAjukan">
                <span class="spinner" v-if="submittingAjukan" />
                <span v-else>Ajukan Pinjaman</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Banknote, Calendar, X, Users } from 'lucide-vue-next'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { pinjamanApi, kelompokApi } from '@/services/api'
import { formatRupiah, formatDate, statusBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const router          = useRouter()
const pinjaman        = ref([])
const loading         = ref(true)
const showAjukan      = ref(false)
const submittingAjukan= ref(false)

const ajukanForm = ref({ jumlahPinjaman: null, tenorBulan: 12, tujuanPinjaman: '' })
const tenorOptions = [3, 6, 12, 18, 24, 36, 48, 60]

const estimasiAngsuran = computed(() => {
  const P = ajukanForm.value.jumlahPinjaman
  const n = ajukanForm.value.tenorBulan
  if (!P || !n) return 0
  const r = 1.5 / 100
  const pow = Math.pow(1 + r, n)
  return Math.round(P * r * pow / (pow - 1))
})

function progressPct(p) {
  if (!p.jumlahPinjaman) return 0
  return Math.min(100, (p.totalSudahDibayar / p.jumlahPinjaman) * 100)
}

function goDetail(id) { router.push(`/pinjaman/${id}`) }

// Pinjaman kelompok
const pinjamanKelompok = ref(null)
const loadingKelompok  = ref(false)

async function loadPinjamanKelompok() {
  loadingKelompok.value = true
  try {
    const res     = await kelompokApi.saya()
    const kelompok = res.data.data
    if (kelompok?.pinjamanAktif?.status === 'DISETUJUI' || kelompok?.pinjamanAktif?.status === 'PENDING') {
      pinjamanKelompok.value = kelompok.pinjamanAktif
    }
  } catch { pinjamanKelompok.value = null }
  finally { loadingKelompok.value = false }
}

async function loadPinjaman() {
  loading.value = true
  try {
    const res     = await pinjamanApi.riwayat({ page: 0, size: 20 })
    const _pg1 = parsePage(res.data.data)
    pinjaman.value = _pg1.content
  } finally {
    loading.value = false
  }
}

async function submitAjukan() {
  submittingAjukan.value = true
  try {
    await pinjamanApi.ajukan(ajukanForm.value)
    toast.success('Pengajuan pinjaman berhasil dikirim!')
    showAjukan.value = false
    ajukanForm.value = { jumlahPinjaman: null, tenorBulan: 12, tujuanPinjaman: '' }
    await loadPinjaman()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal mengajukan pinjaman')
  } finally {
    submittingAjukan.value = false
  }
}

onMounted(() => { loadPinjaman(); loadPinjamanKelompok() })
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.loading-state { display: flex; justify-content: center; padding: 3rem; }
.pinjaman-list { display: flex; flex-direction: column; gap: 12px; }
.pinjaman-card {
  background: var(--clr-surface); border: 1px solid var(--clr-border);
  border-radius: var(--radius-lg); padding: 1.25rem;
  cursor: pointer; transition: all var(--transition);
}
.pinjaman-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.pinjaman-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.pinjaman-no     { font-size: 0.8125rem; font-family: var(--font-mono); color: var(--clr-text-3); }
.pinjaman-tujuan { font-size: 0.9375rem; font-weight: 600; margin-top: 2px; }
.pinjaman-card-body { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
@media (max-width: 600px) { .pinjaman-card-body { grid-template-columns: repeat(2, 1fr); } }
.pinjaman-stat { display: flex; flex-direction: column; gap: 3px; }
.pinjaman-card-footer { margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.progress-bar { flex: 1; height: 6px; background: var(--clr-surface-2); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--clr-primary); border-radius: 99px; transition: width 0.5s ease; }
.pinjaman-date { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--clr-text-3); }
.input-prefix-wrap { position: relative; }
.input-prefix { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--clr-text-3); font-size: 0.875rem; font-weight: 500; pointer-events: none; }
.form-input.has-prefix { padding-left: 38px; }
.form-hint { font-size: 0.75rem; color: var(--clr-text-3); margin-top: 2px; }
.estimasi-box { background: var(--clr-primary-light); border-radius: var(--radius-md); padding: 12px 16px; margin-top: 4px; }
.estimasi-val { font-size: 1.125rem; font-weight: 700; color: var(--clr-primary); }
.btn-icon-close { background: none; border: none; cursor: pointer; color: var(--clr-text-3); padding: 4px; border-radius: var(--radius-sm); }
.btn-icon-close:hover { color: var(--clr-text); background: var(--clr-surface-2); }
.kelompok-info-box { margin-top:0.75rem; background:var(--clr-surface-2); border:1px solid var(--clr-border); border-radius:var(--radius-md); padding:10px 16px; font-size:0.8125rem; color:var(--clr-text-2); display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
.kelompok-link { color:var(--clr-primary); font-weight:600; text-decoration:none; font-size:0.875rem; }
.kelompok-link:hover { text-decoration:underline; }
.kelompok-banner { display:flex; justify-content:space-between; align-items:center; gap:16px; border-left:4px solid var(--clr-primary); }
.kb-left { display:flex; align-items:center; gap:14px; }
.kb-icon { width:44px; height:44px; border-radius:var(--radius-md); background:var(--clr-primary-light); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
</style>