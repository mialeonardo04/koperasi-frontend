<template>
  <div class="admin-simpanan">
    <!-- Filter toolbar -->
    <div class="toolbar">
      <!-- Autocomplete search member -->
      <div class="member-search-wrap" v-click-outside="() => showSuggestions = false">
        <div class="search-wrap">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchText"
            type="text"
            class="form-input search-input"
            placeholder="Cari nama atau nomor anggota..."
            @input="onSearchInput"
            @focus="showSuggestions = true"
            autocomplete="off"
          />
          <button v-if="selectedMember" class="clear-btn" type="button" @click="clearMember">×</button>
        </div>
        <!-- Dropdown suggestions -->
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

      <button class="btn btn-primary" @click="openSetor">
        <Plus :size="16" /> Catat Setoran
      </button>
      <button class="btn btn-secondary" @click="openTarik">
        <Minus :size="16" /> Catat Penarikan
      </button>
    </div>

    <!-- Badge filter aktif -->
    <div class="active-filter" v-if="selectedMember">
      <span>Menampilkan transaksi: <strong>{{ selectedMember.namaLengkap }}</strong></span>
      <button @click="clearMember">×</button>
    </div>

    <!-- Tabel -->
    <div class="card" style="padding:0">
      <div v-if="loading" class="loading-center"><div class="spinner"/></div>
      <div v-else-if="rows.length===0" class="empty-state">
        <Wallet :size="36" style="opacity:0.25"/><p>Belum ada transaksi</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Referensi</th>
              <th>Anggota</th>
              <th>Jenis</th>
              <th>Tipe</th>
              <th>Jumlah</th>
              <th>Keterangan</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td><span class="mono-text">{{ r.noReferensi || '-' }}</span></td>
              <td>
                <div class="member-cell">
                  <span class="font-medium">{{ r.namaAnggota }}</span>
                  <span class="text-xs text-muted mono-text">{{ r.nomorAnggota }}</span>
                </div>
              </td>
              <td><span class="badge" :class="jenisBadge(r.jenis).class">{{ r.jenis }}</span></td>
              <td><span class="badge" :class="r.tipe==='SETOR'?'badge-success':'badge-danger'">{{ r.tipe }}</span></td>
              <td class="money font-medium" :class="r.tipe==='SETOR'?'money-positive':'money-negative'">
                {{ r.tipe==='SETOR' ? '+' : '-' }}{{ formatRupiah(r.jumlah) }}
              </td>
              <td class="text-muted text-sm">{{ r.keterangan || '-' }}</td>
              <td class="text-sm text-muted">{{ formatDateTime(r.tanggalTransaksi) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer" v-if="page.totalPages > 1">
        <span class="text-sm text-muted">{{ page.totalElements }} transaksi</span>
        <div class="pagination">
          <button class="page-btn" :disabled="page.number===0" @click="loadSimpanan(page.number-1)">‹</button>
          <button v-for="p in Math.min(page.totalPages,7)" :key="p" class="page-btn" :class="{active:page.number===p-1}" @click="loadSimpanan(p-1)">{{ p }}</button>
          <button class="page-btn" :disabled="page.number>=page.totalPages-1" @click="loadSimpanan(page.number+1)">›</button>
        </div>
      </div>
    </div>

    <!-- Modal Setor/Tarik -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showModal" @click.self="showModal=false">
        <div class="modal" style="max-width:460px">
          <div class="modal-header">
            <h3>{{ modalMode==='setor' ? 'Catat Setoran' : 'Catat Penarikan' }}</h3>
            <button class="btn-icon-close" @click="showModal=false"><X :size="18"/></button>
          </div>
          <form @submit.prevent="submitModal">
            <div style="display:flex;flex-direction:column;gap:1rem">

              <!-- Pilih anggota dengan search -->
              <div class="form-group">
                <label class="form-label">Anggota</label>
                <div class="member-search-wrap" v-click-outside="() => showModalSuggestions = false">
                  <div class="search-wrap">
                    <Search :size="14" class="search-icon" />
                    <input
                      v-model="modalSearchText"
                      type="text"
                      class="form-input search-input"
                      placeholder="Ketik nama anggota..."
                      @input="onModalSearchInput"
                      @focus="showModalSuggestions = true"
                      autocomplete="off"
                    />
                    <button v-if="modalForm.userId" class="clear-btn" type="button" @click="clearModalMember">×</button>
                  </div>
                  <div class="suggestions" v-if="showModalSuggestions && modalSuggestions.length">
                    <div
                      class="suggestion-item"
                      v-for="m in modalSuggestions" :key="m.id"
                      @mousedown.prevent="selectModalMember(m)"
                    >
                      <div class="suggestion-name">{{ m.namaLengkap }}</div>
                      <div class="suggestion-meta">
                        <span class="mono-text">{{ m.nomorAnggota }}</span>
                        <span class="text-xs text-muted">ID: {{ m.id }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="form-hint" v-if="modalForm.userId">ID: {{ modalForm.userId }}</p>
              </div>

              <div class="form-group">
                <label class="form-label">Jenis Simpanan</label>
                <select v-model="modalForm.jenis" class="form-input form-select" required>
                  <option value="">Pilih...</option>
                  <option value="POKOK">Simpanan Pokok</option>
                  <option value="WAJIB">Simpanan Wajib</option>
                  <option value="SUKARELA">Simpanan Sukarela</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Jumlah</label>
                <CurrencyInput v-model="modalForm.jumlah" :min="1000" :required="true" />
              </div>
              <div class="form-group">
                <label class="form-label">Keterangan</label>
                <input v-model="modalForm.keterangan" type="text" class="form-input" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showModal=false">Batal</button>
              <button type="submit" class="btn" :class="modalMode==='setor'?'btn-primary':'btn-danger'"
                :disabled="submitting || !modalForm.userId">
                <span class="spinner" v-if="submitting"/><span v-else>{{ modalMode==='setor'?'Catat Setoran':'Catat Penarikan' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Minus, Wallet, X } from 'lucide-vue-next'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { adminApi } from '@/services/api'
import { formatRupiah, formatDateTime, jenisBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

// ── State tabel ──
const rows     = ref([])
const loading  = ref(true)
const page     = ref({ number:0, totalPages:1, totalElements:0 })

// ── Filter: search member ──
const searchText      = ref('')
const selectedMember  = ref(null)
const suggestions     = ref([])
const showSuggestions = ref(false)
let   searchTimer     = null

// ── Modal ──
const showModal    = ref(false)
const modalMode    = ref('setor')
const submitting   = ref(false)
const modalForm    = ref({ userId: null, jenis:'', jumlah:null, keterangan:'' })

// Modal search member
const modalSearchText      = ref('')
const modalSuggestions     = ref([])
const showModalSuggestions = ref(false)
let   modalSearchTimer     = null

// ── v-click-outside directive (sederhana) ──
const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutside__ = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el.__clickOutside__)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el.__clickOutside__)
  }
}

// ── Search member (debounce 300ms) ──
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
  loadSimpanan(0)
}

function clearMember() {
  selectedMember.value = null
  searchText.value     = ''
  suggestions.value    = []
  loadSimpanan(0)
}

// ── Modal search member ──
function onModalSearchInput() {
  clearTimeout(modalSearchTimer)
  if (!modalSearchText.value || modalSearchText.value.length < 2) { modalSuggestions.value = []; return }
  modalSearchTimer = setTimeout(async () => {
    try {
      const res = await adminApi.members({ search: modalSearchText.value, page: 0, size: 8 })
      modalSuggestions.value = res.data.data.content
    } catch {}
  }, 300)
}

function selectModalMember(m) {
  modalForm.value.userId    = m.id
  modalSearchText.value     = `${m.namaLengkap} (${m.nomorAnggota})`
  modalSuggestions.value    = []
  showModalSuggestions.value = false
}

function clearModalMember() {
  modalForm.value.userId = null
  modalSearchText.value  = ''
}

// ── Load data ──
async function loadSimpanan(p=0) {
  loading.value = true
  try {
    const params = { page: p, size: 15 }
    if (selectedMember.value) params.userId = selectedMember.value.id
    const res = await adminApi.allSimpanan(params)
    const d   = parsePage(res.data.data)
    rows.value = d.content
    page.value = { number: d.number, totalPages: d.totalPages, totalElements: d.totalElements }
  } finally {
    loading.value = false
  }
}

function openSetor() {
  modalMode.value = 'setor'
  modalForm.value = { userId: null, jenis:'', jumlah:null, keterangan:'' }
  modalSearchText.value = ''
  showModal.value = true
}
function openTarik() {
  modalMode.value = 'tarik'
  modalForm.value = { userId: null, jenis:'', jumlah:null, keterangan:'' }
  modalSearchText.value = ''
  showModal.value = true
}

async function submitModal() {
  if (!modalForm.value.userId) { toast.error('Pilih anggota terlebih dahulu'); return }
  submitting.value = true
  try {
    const { userId, ...data } = modalForm.value
    const fn = modalMode.value==='setor' ? adminApi.setorMember : adminApi.tarikMember
    await fn(userId, data)
    toast.success(`${modalMode.value==='setor'?'Setoran':'Penarikan'} berhasil dicatat!`)
    showModal.value = false
    await loadSimpanan(0)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mencatat transaksi')
  } finally {
    submitting.value = false
  }
}

onMounted(() => loadSimpanan(0))
</script>

<style scoped>
.toolbar { display:flex; gap:10px; margin-bottom:1.25rem; align-items:center; flex-wrap:wrap; }

/* Member search autocomplete */
.member-search-wrap { position:relative; flex:1; min-width:220px; max-width:340px; }
.search-wrap { position:relative; }
.search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); pointer-events:none; }
.search-input { padding-left:38px; padding-right:30px; width:100%; }
.clear-btn {
  position:absolute; right:10px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; color:var(--clr-text-3);
  font-size:1.1rem; line-height:1; padding:0;
}
.clear-btn:hover { color:var(--clr-danger); }

.suggestions {
  position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:50;
  background:var(--clr-surface); border:1px solid var(--clr-border);
  border-radius:var(--radius-lg); box-shadow:var(--shadow-md);
  overflow:hidden; max-height:240px; overflow-y:auto;
}
.suggestion-item { padding:10px 14px; cursor:pointer; transition:background var(--transition); }
.suggestion-item:hover { background:var(--clr-surface-2); }
.suggestion-name { font-size:0.875rem; font-weight:500; }
.suggestion-meta { display:flex; gap:10px; margin-top:2px; }

.active-filter {
  display:inline-flex; align-items:center; gap:8px;
  background:var(--clr-primary-light); color:var(--clr-primary);
  border-radius:var(--radius-full); padding:5px 12px;
  font-size:0.8125rem; margin-bottom:1rem;
}
.active-filter button { background:none; border:none; cursor:pointer; color:var(--clr-primary); font-size:1rem; line-height:1; }
.active-filter button:hover { color:var(--clr-danger); }

.loading-center { display:flex; justify-content:center; padding:2.5rem; }
.table-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-top:1px solid var(--clr-border); }
.mono-text { font-family:var(--font-mono); font-size:0.8rem; }
.member-cell { display:flex; flex-direction:column; gap:2px; }
.input-prefix-wrap { position:relative; }
.input-prefix { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); font-size:0.875rem; pointer-events:none; }
.form-input.has-prefix { padding-left:38px; }
.btn-icon-close { background:none; border:none; cursor:pointer; color:var(--clr-text-3); padding:4px; border-radius:var(--radius-sm); }
.btn-icon-close:hover { color:var(--clr-text); background:var(--clr-surface-2); }
.form-hint { font-size:0.75rem; color:var(--clr-text-3); margin-top:3px; }
</style>