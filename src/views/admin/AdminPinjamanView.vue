<template>
  <div class="admin-pinjaman">
    <!-- Tab toggle -->
    <div class="tab-toggle" style="margin-bottom:1rem">
      <button class="tab-btn" :class="{active: tipeView==='individu'}" @click="switchTab('individu')">Pinjaman Individu</button>
      <button class="tab-btn" :class="{active: tipeView==='kelompok'}" @click="switchTab('kelompok')">
        Pinjaman Kelompok
        <span v-if="pendingKelompok > 0" class="badge-count">{{ pendingKelompok }}</span>
      </button>
    </div>

    <!-- Filter -->
    <div class="toolbar" v-if="tipeView==='individu'">
      <select v-model="filterStatus" class="form-input form-select" style="max-width:180px" @change="loadPinjaman(0)">
        <option value="">Semua Status</option>
        <option value="PENDING">Menunggu</option>
        <option value="DISETUJUI">Disetujui</option>
        <option value="DITOLAK">Ditolak</option>
        <option value="LUNAS">Lunas</option>
        <option value="MACET">Macet</option>
      </select>

      <!-- Autocomplete search member -->
      <div class="member-search-wrap" v-click-outside="() => showSuggestions = false">
        <div class="search-wrap">
          <Search :size="15" class="search-icon" />
          <input
            v-model="searchText"
            type="text"
            class="form-input search-input"
            placeholder="Cari nama anggota..."
            @input="onSearchInput"
            @focus="showSuggestions = true"
            autocomplete="off"
          />
          <button v-if="selectedMember" class="clear-btn" type="button" @click="clearMember">×</button>
        </div>
        <div class="suggestions" v-if="showSuggestions && suggestions.length">
          <div
            class="suggestion-item"
            v-for="m in suggestions" :key="m.id"
            @mousedown.prevent="selectMember(m)"
          >
            <div class="suggestion-name">{{ m.namaLengkap }}</div>
            <div class="suggestion-meta">
              <span class="mono-text">{{ m.nomorAnggota }}</span>
              <span class="text-xs text-muted">ID: {{ m.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Badge filter aktif -->
    <div class="active-filter" v-if="selectedMember">
      <span>Anggota: <strong>{{ selectedMember.namaLengkap }}</strong></span>
      <button @click="clearMember">×</button>
    </div>

    <!-- Tabel -->
    <div class="card" style="padding:0">
      <div v-if="loading" class="loading-center"><div class="spinner"/></div>
      <div v-else-if="rows.length===0" class="empty-state">
        <Banknote :size="36" style="opacity:0.25"/><p>Tidak ada data pinjaman</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Pinjaman</th>
              <th>Anggota</th>
              <th>Jumlah</th>
              <th>Bunga</th>
              <th>Tenor</th>
              <th>Angsuran/bln</th>
              <th>Sisa</th>
              <th>Status</th>
              <th>Tgl Pengajuan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td><span class="mono-text">{{ r.noPinjaman }}</span></td>
              <td>
                <div class="member-cell">
                  <span class="font-medium">{{ r.namaAnggota }}</span>
                  <span class="text-xs text-muted mono-text">{{ r.nomorAnggota }}</span>
                </div>
              </td>
              <td class="money font-medium">{{ formatRupiah(r.jumlahPinjaman) }}</td>
              <td>{{ r.bungaPerBulan }}%</td>
              <td>{{ r.tenorBulan }} bln</td>
              <td class="money">{{ formatRupiah(r.angsuranPerBulan) }}</td>
              <td class="money money-negative">{{ formatRupiah(r.sisaPinjaman) }}</td>
              <td><span class="badge" :class="statusBadge(r.status).class">{{ statusBadge(r.status).label }}</span></td>
              <td class="text-sm text-muted">{{ formatDate(r.tanggalPengajuan) }}</td>
              <td>
                <div class="action-row">
                  <button class="btn btn-ghost btn-sm" @click="openDetail(r)" title="Jadwal Angsuran"><Eye :size="14"/></button>
                  <button v-if="r.status==='PENDING'" class="btn btn-primary btn-sm" @click="openApproval(r)">Proses</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer" v-if="page.totalPages>1">
        <span class="text-sm text-muted">{{ page.totalElements }} pinjaman</span>
        <div class="pagination">
          <button class="page-btn" :disabled="page.number===0" @click="loadPinjaman(page.number-1)">‹</button>
          <button v-for="p in Math.min(page.totalPages,7)" :key="p" class="page-btn" :class="{active:page.number===p-1}" @click="loadPinjaman(p-1)">{{ p }}</button>
          <button class="page-btn" :disabled="page.number>=page.totalPages-1" @click="loadPinjaman(page.number+1)">›</button>
        </div>
      </div>
    </div>

    <!-- Modal: Approval -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showApproval" @click.self="showApproval=false">
        <div class="modal" style="max-width:440px">
          <div class="modal-header">
            <h3>Proses Pengajuan Pinjaman</h3>
            <button class="btn-icon-close" @click="showApproval=false"><X :size="18"/></button>
          </div>
          <div class="approval-info" v-if="selectedPinjaman">
            <div class="ai-row"><span>Pemohon</span><strong>{{ selectedPinjaman.namaAnggota }}</strong></div>
            <div class="ai-row"><span>Jumlah</span><strong class="money">{{ formatRupiah(selectedPinjaman.jumlahPinjaman) }}</strong></div>
            <div class="ai-row"><span>Tenor</span><strong>{{ selectedPinjaman.tenorBulan }} bulan</strong></div>
            <div class="ai-row"><span>Tujuan</span><strong>{{ selectedPinjaman.tujuanPinjaman || '-' }}</strong></div>
          </div>
          <form @submit.prevent="submitApproval">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">Bunga per Bulan (%)</label>
                <input v-model.number="approvalForm.bungaPerBulan" type="number" step="0.1" min="0" class="form-input" placeholder="1.5" />
              </div>
              <div class="form-group">
                <label class="form-label">Keterangan Admin</label>
                <input v-model="approvalForm.keteranganAdmin" type="text" class="form-input" placeholder="Opsional..." />
              </div>
            </div>
            <div class="modal-footer" style="gap:8px">
              <button type="button" class="btn btn-secondary" @click="showApproval=false">Batal</button>
              <button type="button" class="btn btn-danger" :disabled="submitting" @click="submitTolak">
                <span class="spinner" v-if="submitting==='tolak'"/><span v-else>Tolak</span>
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span class="spinner" v-if="submitting==='setujui'"/><span v-else>Setujui</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Jadwal Angsuran -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showJadwal" @click.self="showJadwal=false">
        <div class="modal" style="max-width:680px">
          <div class="modal-header">
            <h3>Jadwal Angsuran — {{ selectedPinjaman?.noPinjaman }}</h3>
            <button class="btn-icon-close" @click="showJadwal=false"><X :size="18"/></button>
          </div>
          <div v-if="loadingJadwal" class="loading-center"><div class="spinner"/></div>
          <div v-else class="table-wrap" style="max-height:420px;overflow-y:auto">
            <table>
              <thead>
                <tr><th>Ke-</th><th>Jatuh Tempo</th><th>Pokok</th><th>Bunga</th><th>Total</th><th>Tgl Bayar</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-for="a in jadwal" :key="a.id">
                  <td>{{ a.periodeKe }}</td>
                  <td>{{ formatDate(a.tanggalJatuhTempo) }}</td>
                  <td class="money">{{ formatRupiah(a.pokok) }}</td>
                  <td class="money">{{ formatRupiah(a.bunga) }}</td>
                  <td class="money font-semibold">{{ formatRupiah(a.jumlahAngsuran) }}</td>
                  <td>{{ a.tanggalBayar ? formatDate(a.tanggalBayar) : '-' }}</td>
                  <td><span class="badge" :class="statusBadge(a.status).class">{{ statusBadge(a.status).label }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Banknote, Eye, X, Search } from 'lucide-vue-next'
import { adminApi } from '@/services/api'
import { useApprovalStore } from '@/stores/approval'
import { formatRupiah, formatDate, statusBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const approvalStore = useApprovalStore()
const rows         = ref([])
const kelompokRows = ref([])
const loadingKelompok = ref(false)
const pendingKelompok = ref(0)
const loading      = ref(true)
const filterStatus = ref('')
const page         = ref({ number:0, totalPages:1, totalElements:0 })
const submitting   = ref(false)

// Member autocomplete
const searchText      = ref('')
const selectedMember  = ref(null)
const suggestions     = ref([])
const showSuggestions = ref(false)
let   searchTimer     = null

const showApproval     = ref(false)
const showJadwal       = ref(false)
const loadingJadwal    = ref(false)
const selectedPinjaman = ref(null)
const jadwal           = ref([])
const approvalForm     = ref({ bungaPerBulan: 1.5, keteranganAdmin: '' })

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutside__ = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el.__clickOutside__)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el.__clickOutside__)
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  if (!searchText.value || searchText.value.length < 2) { suggestions.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const res = await adminApi.members({ search: searchText.value, page: 0, size: 8 })
      suggestions.value = res.data.data.content
    } catch {}
  }, 300)
}

function selectMember(m) {
  selectedMember.value  = m
  searchText.value      = m.namaLengkap
  suggestions.value     = []
  showSuggestions.value = false
  loadPinjaman(0)
}

function clearMember() {
  selectedMember.value = null
  searchText.value     = ''
  suggestions.value    = []
  loadPinjaman(0)
}

async function loadPinjaman(p=0) {
  loading.value = true
  try {
    const params = { page:p, size:15 }
    if (filterStatus.value)              params.status = filterStatus.value
    if (selectedMember.value)            params.userId = selectedMember.value.id
    const res = await adminApi.allPinjaman(params)
    const d   = parsePage(res.data.data)
    rows.value = d.content
    page.value = { number:d.number, totalPages:d.totalPages, totalElements:d.totalElements }
  } finally {
    loading.value = false
  }
}

function openApproval(r) {
  selectedPinjaman.value = r
  approvalForm.value     = { bungaPerBulan: 1.5, keteranganAdmin: '' }
  showApproval.value     = true
}

async function openDetail(r) {
  selectedPinjaman.value = r
  jadwal.value     = []
  showJadwal.value = true
  loadingJadwal.value = true
  try {
    const res = await adminApi.jadwalAngsuranAdmin(r.id)
    jadwal.value = res.data.data
  } finally {
    loadingJadwal.value = false
  }
}

async function submitApproval() {
  submitting.value = 'setujui'
  try {
    await adminApi.prosesPinjaman(selectedPinjaman.value.id, { disetujui: true, ...approvalForm.value })
    toast.success('Pinjaman berhasil disetujui!')
    showApproval.value = false
    approvalStore.decrementPinjaman()
    await loadPinjaman(page.value.number)
    await approvalStore.refresh()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal menyetujui pinjaman')
  } finally { submitting.value = false }
}

async function submitTolak() {
  submitting.value = 'tolak'
  try {
    await adminApi.prosesPinjaman(selectedPinjaman.value.id, { disetujui: false, keteranganAdmin: approvalForm.value.keteranganAdmin })
    toast.success('Pinjaman berhasil ditolak')
    showApproval.value = false
    approvalStore.decrementPinjaman()
    await loadPinjaman(page.value.number)
    await approvalStore.refresh()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal menolak pinjaman')
  } finally { submitting.value = false }
}

onMounted(() => loadPinjaman(0))
</script>

<style scoped>
.toolbar { display:flex; gap:10px; margin-bottom:1.25rem; align-items:center; flex-wrap:wrap; }
.member-search-wrap { position:relative; flex:1; min-width:220px; max-width:300px; }
.search-wrap { position:relative; }
.search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); pointer-events:none; }
.search-input { padding-left:36px; padding-right:28px; width:100%; }
.clear-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--clr-text-3); font-size:1.1rem; line-height:1; }
.clear-btn:hover { color:var(--clr-danger); }
.suggestions { position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:50; background:var(--clr-surface); border:1px solid var(--clr-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); overflow:hidden; max-height:240px; overflow-y:auto; }
.tab-toggle { display:flex; gap:4px; border-bottom:2px solid var(--clr-border); }
.tab-btn { background:none; border:none; padding:8px 20px; font-size:0.9375rem; cursor:pointer; color:var(--clr-text-3); position:relative; transition:color var(--transition); display:flex; align-items:center; gap:6px; }
.tab-btn.active { color:var(--clr-primary); font-weight:600; }
.tab-btn.active::after { content:""; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:var(--clr-primary); border-radius:2px; }
.badge-count { background:var(--clr-danger); color:#fff; font-size:0.65rem; font-weight:700; padding:1px 6px; border-radius:var(--radius-full); }
.suggestion-item { padding:10px 14px; cursor:pointer; transition:background var(--transition); }
.suggestion-item:hover { background:var(--clr-surface-2); }
.suggestion-name { font-size:0.875rem; font-weight:500; }
.suggestion-meta { display:flex; gap:10px; margin-top:2px; }
.active-filter { display:inline-flex; align-items:center; gap:8px; background:var(--clr-primary-light); color:var(--clr-primary); border-radius:var(--radius-full); padding:5px 12px; font-size:0.8125rem; margin-bottom:1rem; }
.active-filter button { background:none; border:none; cursor:pointer; color:var(--clr-primary); font-size:1rem; line-height:1; }
.loading-center { display:flex; justify-content:center; padding:2.5rem; }
.table-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-top:1px solid var(--clr-border); }
.mono-text { font-family:var(--font-mono); font-size:0.8rem; }
.member-cell { display:flex; flex-direction:column; gap:2px; }
.action-row { display:flex; gap:4px; }
.approval-info { background:var(--clr-surface-2); border-radius:var(--radius-md); padding:12px 16px; margin-bottom:1.25rem; display:flex; flex-direction:column; gap:8px; }
.ai-row { display:flex; justify-content:space-between; font-size:0.875rem; }
.ai-row span { color:var(--clr-text-3); }
.btn-icon-close { background:none; border:none; cursor:pointer; color:var(--clr-text-3); padding:4px; border-radius:var(--radius-sm); }
.btn-icon-close:hover { color:var(--clr-text); background:var(--clr-surface-2); }
</style>