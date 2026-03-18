<template>
  <div class="admin-members">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <Search :size="16" class="search-icon" />
        <input v-model="search" type="text" class="form-input search-input" placeholder="Cari nama atau nomor anggota..." @input="onSearch" />
      </div>
      <button class="btn btn-primary" @click="openTambah">
        <UserPlus :size="16" /> Tambah User
      </button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0">
      <div v-if="loading" class="loading-center"><div class="spinner"/></div>
      <div v-else-if="members.length === 0" class="empty-state">
        <Users :size="36" style="opacity:0.25" /><p>Tidak ada anggota ditemukan</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Anggota</th>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>No. Telepon</th>
              <th>Total Simpanan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id">
              <td><span class="mono-text">{{ m.nomorAnggota }}</span></td>
              <td class="font-medium">{{ m.namaLengkap }}</td>
              <td class="text-muted">{{ m.email }}</td>
              <td>{{ m.noTelepon || '-' }}</td>
              <td class="money font-medium">{{ formatRupiah(m.totalSimpanan) }}</td>
              <td><span class="badge" :class="statusBadge(m.status).class">{{ statusBadge(m.status).label }}</span></td>
              <td>
                <div class="action-row">
                  <button class="btn btn-ghost btn-sm" @click="openDetail(m)" title="Detail"><Eye :size="14"/></button>
                  <button class="btn btn-ghost btn-sm" @click="openEditStatus(m)" title="Ubah Status"><Settings :size="14"/></button>
                  <button class="btn btn-ghost btn-sm" @click="openSaldo(m)" title="Lihat Saldo"><Wallet :size="14"/></button>
                  <button
                    class="btn btn-ghost btn-sm"
                    :class="m.telegramChatId ? 'telegram-linked' : 'telegram-unlinked'"
                    @click="openEditTelegram(m)"
                    :title="m.telegramChatId ? 'Telegram: ' + m.telegramChatId : 'Belum ada Chat ID Telegram'"
                  >
                    <Send :size="14"/>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="table-footer" v-if="page.totalPages > 1">
        <span class="text-sm text-muted">Total {{ page.totalElements }} anggota</span>
        <div class="pagination">
          <button class="page-btn" :disabled="page.number===0" @click="loadMembers(page.number-1)">‹</button>
          <button v-for="p in page.totalPages" :key="p" class="page-btn" :class="{active: page.number===p-1}" @click="loadMembers(p-1)">{{ p }}</button>
          <button class="page-btn" :disabled="page.number>=page.totalPages-1" @click="loadMembers(page.number+1)">›</button>
        </div>
      </div>
    </div>

    <!-- Modal: Tambah Member -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTambah" @click.self="showTambah=false">
        <div class="modal">
          <div class="modal-header">
            <h3>Tambah Member Baru</h3>
            <button class="btn-icon-close" @click="showTambah=false"><X :size="18"/></button>
          </div>
          <form @submit.prevent="submitTambah">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <input v-model="tambahForm.namaLengkap" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="tambahForm.email" type="email" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input v-model="tambahForm.password" type="password" class="form-input" minlength="6" required />
              </div>
              <div class="form-group">
                <label class="form-label">Alamat</label>
                <input v-model="tambahForm.alamat" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select v-model="tambahForm.role" class="form-input form-select" required>
                  <option value="MEMBER">Member (Anggota Biasa)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Telegram Chat ID <span class="required-mark">*</span></label>
                <input v-model="tambahForm.telegramChatId" type="text" class="form-input" placeholder="Contoh: 436703107" required />
                <div class="tg-hint-red">
                  <span class="tg-hint-title">Cara mendapatkan Chat ID:</span>
                  <ol>
                    <li>Buka Telegram → cari <strong>@koperasi_leyangan_bot</strong> → klik <strong>Start</strong></li>
                    <li>Chat ke <strong>@userinfobot</strong> → klik Start → lihat field <strong>Id</strong></li>
                    <li>Salin angka tersebut ke kolom ini</li>
                  </ol>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showTambah=false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span class="spinner" v-if="submitting"/><span v-else>Tambah User</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Detail Member -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showDetail" @click.self="showDetail=false">
        <div class="modal" style="max-width:540px">
          <div class="modal-header">
            <h3>Detail Anggota</h3>
            <button class="btn-icon-close" @click="showDetail=false"><X :size="18"/></button>
          </div>
          <div v-if="selectedMember" class="detail-grid">
            <div class="detail-avatar">{{ avatarOf(selectedMember) }}</div>
            <div>
              <h3>{{ selectedMember.namaLengkap }}</h3>
              <p class="text-muted text-sm" style="font-family:var(--font-mono)">{{ selectedMember.nomorAnggota }}</p>
            </div>
            <div class="detail-info-grid">
              <div class="di-row"><span class="di-label">Email</span><span>{{ selectedMember.email }}</span></div>
              <div class="di-row"><span class="di-label">Role</span><span>{{ selectedMember.role }}</span></div>
              <div class="di-row"><span class="di-label">Status</span>
                <span class="badge" :class="statusBadge(selectedMember.status).class">{{ statusBadge(selectedMember.status).label }}</span>
              </div>
              <div class="di-row"><span class="di-label">Total Simpanan</span><span class="money font-semibold">{{ formatRupiah(selectedMember.totalSimpanan) }}</span></div>
              <div class="di-row">
                <span class="di-label">Telegram Chat ID</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="mono-text text-sm">{{ selectedMember.telegramChatId || '-' }}</span>
                  <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.75rem" @click="openEditTelegram(selectedMember)">Edit</button>
                </div>
              </div>
            </div>
          </div>
          <!-- Saldo detail -->
          <div v-if="saldoDetail" class="saldo-detail-box">
            <p class="text-xs text-muted" style="margin-bottom:8px">Rincian Saldo Simpanan</p>
            <div class="saldo-row"><span>Simpanan Pokok</span><span class="money">{{ formatRupiah(saldoDetail.simpananPokok) }}</span></div>
            <div class="saldo-row"><span>Simpanan Wajib</span><span class="money">{{ formatRupiah(saldoDetail.simpananWajib) }}</span></div>
            <div class="saldo-row"><span>Simpanan Sukarela</span><span class="money">{{ formatRupiah(saldoDetail.simpananSukarela) }}</span></div>
            <div class="saldo-row total"><span>Total</span><span class="money font-semibold">{{ formatRupiah(saldoDetail.totalSimpanan) }}</span></div>
          </div>
          <div class="modal-footer" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" @click="openSetorAdmin(selectedMember)"><ArrowDownCircle :size="14"/> Setor</button>
            <button class="btn btn-secondary btn-sm" @click="openTarikAdmin(selectedMember)"><ArrowUpCircle :size="14"/> Tarik</button>
            <button class="btn btn-secondary btn-sm" @click="openEditStatus(selectedMember)"><Settings :size="14"/> Ubah Status</button>
            <button class="btn btn-warning btn-sm" @click="openEditRole(selectedMember)"><ShieldCheck :size="14"/> Ubah Role</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Edit Status -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showEditStatus" @click.self="showEditStatus=false">
        <div class="modal" style="max-width:380px">
          <div class="modal-header">
            <h3>Ubah Status Anggota</h3>
            <button class="btn-icon-close" @click="showEditStatus=false"><X :size="18"/></button>
          </div>
          <p class="text-sm text-muted" style="margin-bottom:1rem">{{ selectedMember?.namaLengkap }}</p>
          <div class="form-group">
            <label class="form-label">Status Baru</label>
            <select v-model="newStatus" class="form-input form-select">
              <option value="AKTIF">Aktif</option>
              <option value="NON_AKTIF">Non Aktif</option>
              <option value="SUSPEND">Suspend</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showEditStatus=false">Batal</button>
            <button class="btn btn-primary" :disabled="submitting" @click="submitStatus">
              <span class="spinner" v-if="submitting"/><span v-else>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Setor/Tarik Admin -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTransaksi" @click.self="showTransaksi=false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>{{ transaksiMode==='setor' ? 'Catat Setoran' : 'Catat Penarikan' }} untuk {{ selectedMember?.namaLengkap }}</h3>
            <button class="btn-icon-close" @click="showTransaksi=false"><X :size="18"/></button>
          </div>
          <form @submit.prevent="submitTransaksiAdmin">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">Jenis Simpanan</label>
                <select v-model="transaksiForm.jenis" class="form-input form-select" required>
                  <option value="">Pilih...</option>
                  <option value="POKOK">Simpanan Pokok</option>
                  <option value="WAJIB">Simpanan Wajib</option>
                  <option value="SUKARELA">Simpanan Sukarela</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Jumlah</label>
                <CurrencyInput v-model="transaksiForm.jumlah" :min="1000" :required="true" />
              </div>
              <div class="form-group">
                <label class="form-label">Keterangan</label>
                <input v-model="transaksiForm.keterangan" type="text" class="form-input" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showTransaksi=false">Batal</button>
              <button type="submit" class="btn" :class="transaksiMode==='setor'?'btn-primary':'btn-danger'" :disabled="submitting">
                <span class="spinner" v-if="submitting"/><span v-else>{{ transaksiMode==='setor'?'Setor':'Tarik' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Edit Telegram Chat ID -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showEditTelegram" @click.self="showEditTelegram=false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>Edit Chat ID Telegram</h3>
            <button class="btn-icon-close" @click="showEditTelegram=false"><X :size="18"/></button>
          </div>
          <p class="text-sm text-muted" style="margin-bottom:1rem">{{ selectedMember?.namaLengkap }}</p>
          <div class="info-box" style="margin-bottom:1rem;font-size:0.8rem">
            💡 Chat ID bisa didapat dengan chat ke bot <strong>@userinfobot</strong> di Telegram
          </div>
          <div class="form-group">
            <label class="form-label">Chat ID Telegram</label>
            <input v-model="newTelegramChatId" type="text" class="form-input" placeholder="Contoh: 123456789" />
            <p class="form-hint">Kosongkan untuk hapus Chat ID</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showEditTelegram=false">Batal</button>
            <button class="btn btn-primary" :disabled="submitting" @click="submitTelegram">
              <span class="spinner" v-if="submitting"/><span v-else>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Ubah Role -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showEditRole" @click.self="showEditRole=false">
        <div class="modal" style="max-width:380px">
          <div class="modal-header">
            <h3>Ubah Role Pengguna</h3>
            <button class="btn-icon-close" @click="showEditRole=false"><X :size="18"/></button>
          </div>
          <p class="text-sm text-muted" style="margin-bottom:4px">{{ selectedMember?.namaLengkap }}</p>
          <p class="text-xs text-muted" style="margin-bottom:1rem">Role saat ini: <strong>{{ selectedMember?.role }}</strong></p>
          <div class="info-box-warning" v-if="newRole === 'ADMIN'">
            ⚠️ User ini akan mendapatkan akses penuh ke semua fitur admin.
          </div>
          <div class="form-group" style="margin-top:0.75rem">
            <label class="form-label">Role Baru</label>
            <select v-model="newRole" class="form-input form-select">
              <option value="MEMBER">Member (Anggota Biasa)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showEditRole=false">Batal</button>
            <button class="btn btn-primary" :disabled="submitting" @click="submitRole">
              <span class="spinner" v-if="submitting"/><span v-else>Simpan Role</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, UserPlus, Users, Eye, Settings, Wallet, X, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Send } from 'lucide-vue-next'
import CurrencyInput from '@/components/CurrencyInput.vue'
import { adminApi } from '@/services/api'
import { formatRupiah, statusBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const members   = ref([])
const loading   = ref(true)
const search    = ref('')
const page      = ref({ number: 0, totalPages: 1, totalElements: 0 })
const submitting= ref(false)

const showTambah    = ref(false)
const showDetail    = ref(false)
const showEditStatus= ref(false)
const showTransaksi  = ref(false)
const showEditRole      = ref(false)
const newRole           = ref('MEMBER')
const showEditTelegram  = ref(false)
const showTgHint        = ref(false)
const tgHintBtn         = ref(null)
const tgPopoverStyle    = ref({})
const newTelegramChatId = ref('')
const selectedMember = ref(null)
const saldoDetail    = ref(null)
const newStatus      = ref('AKTIF')
const transaksiMode  = ref('setor')

const tambahForm   = ref({ namaLengkap:'', email:'', password:'', noTelepon:'', alamat:'' })
const transaksiForm= ref({ jenis:'', jumlah:null, keterangan:'' })

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadMembers(0), 400)
}

function avatarOf(m) {
  return (m?.namaLengkap||'').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
}

async function loadMembers(p = 0) {
  loading.value = true
  try {
    const mParams = { page: p, size: 15 }
    if (search.value) mParams.search = search.value
    const res = await adminApi.members(mParams)
    const d   = parsePage(res.data.data)
    members.value = d.content
    page.value    = { number: d.number, totalPages: d.totalPages, totalElements: d.totalElements }
  } finally {
    loading.value = false
  }
}

function openTambah() {
  tambahForm.value = { namaLengkap:'', email:'', password:'', noTelepon:'', alamat:'', role:'MEMBER', telegramChatId:'' }
  showTambah.value = true
}

async function submitTambah() {
  submitting.value = true
  try {
    await adminApi.createUser(tambahForm.value)
    toast.success('User berhasil ditambahkan!')
    showTambah.value = false
    await loadMembers(0)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal menambahkan user')
  } finally {
    submitting.value = false
  }
}

async function openDetail(m) {
  selectedMember.value = m
  saldoDetail.value    = null
  showDetail.value     = true
  try {
    const res = await adminApi.saldoMember(m.id)
    saldoDetail.value = res.data.data
  } catch {}
}

function openSaldo(m) { openDetail(m) }

function openEditStatus(m) {
  selectedMember.value = m
  newStatus.value      = m.status
  showEditStatus.value = true
  showDetail.value     = false
}

async function submitStatus() {
  submitting.value = true
  try {
    await adminApi.updateStatus(selectedMember.value.id, newStatus.value)
    toast.success('Status anggota diperbarui!')
    showEditStatus.value = false
    await loadMembers(page.value.number)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah status')
  } finally {
    submitting.value = false
  }
}

function openSetorAdmin(m) {
  selectedMember.value = m; transaksiMode.value = 'setor'
  transaksiForm.value  = { jenis:'', jumlah:null, keterangan:'' }
  showDetail.value = false; showTransaksi.value = true
}
function openTarikAdmin(m) {
  selectedMember.value = m; transaksiMode.value = 'tarik'
  transaksiForm.value  = { jenis:'', jumlah:null, keterangan:'' }
  showDetail.value = false; showTransaksi.value = true
}

async function submitTransaksiAdmin() {
  submitting.value = true
  try {
    const fn = transaksiMode.value === 'setor' ? adminApi.setorMember : adminApi.tarikMember
    await fn(selectedMember.value.id, transaksiForm.value)
    toast.success(`${transaksiMode.value === 'setor' ? 'Setoran' : 'Penarikan'} berhasil dicatat!`)
    showTransaksi.value = false
    await loadMembers(page.value.number)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mencatat transaksi')
  } finally {
    submitting.value = false
  }
}

function onTgHintEnter() {
  if (tgHintBtn.value) {
    const rect = tgHintBtn.value.getBoundingClientRect()
    tgPopoverStyle.value = {
      top:  (rect.bottom + 8) + 'px',
      left: Math.min(rect.left, window.innerWidth - 276) + 'px'
    }
  }
  showTgHint.value = true
}

function openEditTelegram(m) {
  selectedMember.value  = m
  newTelegramChatId.value = m.telegramChatId || ''
  showEditTelegram.value  = true
  showDetail.value        = false
}

async function submitTelegram() {
  submitting.value = true
  try {
    await adminApi.updateTelegramChatId(selectedMember.value.id, newTelegramChatId.value || null)
    toast.success('Chat ID Telegram berhasil diperbarui!')
    showEditTelegram.value = false
    await loadMembers(page.value.number)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal update Chat ID')
  } finally {
    submitting.value = false
  }
}

function openEditRole(m) {
  selectedMember.value = m
  newRole.value        = m.role
  showEditRole.value   = true
  showDetail.value     = false
}

async function submitRole() {
  submitting.value = true
  try {
    await adminApi.updateRole(selectedMember.value.id, newRole.value)
    toast.success('Role berhasil diperbarui!')
    showEditRole.value = false
    await loadMembers(page.value.number)
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mengubah role')
  } finally {
    submitting.value = false
  }
}

// Normalisasi nomor ke format WA internasional: 628xxxxxxxxxx
function normalizeWA(phone) {
  if (!phone) return phone
  let p = phone.replace(/[\s\-\(\)]/g, '')
  if (p.startsWith('+62')) return p.slice(1)
  if (p.startsWith('08'))  return '62' + p.slice(1)
  if (p.startsWith('628')) return p
  return p
}

onMounted(() => loadMembers(0))
</script>

<style scoped>
.toolbar { display:flex; gap:10px; margin-bottom:1.25rem; align-items:center; }
.search-wrap { position:relative; flex:1; max-width:380px; }
.search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); pointer-events:none; }
.search-input { padding-left:38px; }
.action-row { display:flex; gap:4px; }
.loading-center { display:flex; justify-content:center; padding:2.5rem; }
.table-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-top:1px solid var(--clr-border); }
.mono-text { font-family:var(--font-mono); font-size:0.8125rem; }
.detail-grid { display:flex; flex-direction:column; gap:12px; margin-bottom:1.25rem; }
.detail-avatar {
  width:52px; height:52px; border-radius:50%; background:var(--clr-primary); color:#fff;
  display:flex; align-items:center; justify-content:center; font-size:1.125rem; font-weight:700;
}
.detail-info-grid { display:flex; flex-direction:column; gap:8px; background:var(--clr-surface-2); padding:12px; border-radius:var(--radius-md); }
.di-row { display:flex; justify-content:space-between; font-size:0.875rem; align-items:center; }
.di-label { color:var(--clr-text-3); }
.saldo-detail-box { background:var(--clr-primary-light); border-radius:var(--radius-md); padding:12px 16px; margin-bottom:1rem; }
.saldo-row { display:flex; justify-content:space-between; font-size:0.875rem; padding:4px 0; }
.saldo-row.total { border-top:1px solid rgba(27,77,62,0.15); margin-top:6px; padding-top:8px; }
.input-prefix-wrap { position:relative; }
.input-prefix { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--clr-text-3); font-size:0.875rem; pointer-events:none; }
.form-input.has-prefix { padding-left:38px; }
.tg-hint-red { margin-top:5px; font-size:0.72rem; color:#dc2626; line-height:1.6; }
.tg-hint-title { font-weight:600; display:block; margin-bottom:2px; }
.tg-hint-red ol { margin:0; padding-left:14px; }
.tg-hint-red strong { color:#b91c1c; }
.btn-icon-close { background:none; border:none; cursor:pointer; color:var(--clr-text-3); padding:4px; border-radius:var(--radius-sm); }
.btn-icon-close:hover { color:var(--clr-text); background:var(--clr-surface-2); }
.telegram-linked   { color:#2aabee !important; }
.telegram-unlinked { color:var(--clr-text-3); opacity:0.5; }
.telegram-linked:hover   { background:rgba(42,171,238,0.1) !important; }
.telegram-unlinked:hover { opacity:1; }
.btn-warning { background:var(--clr-accent-light); color:#92400e; border:1px solid rgba(180,120,0,0.3); display:inline-flex; align-items:center; gap:5px; }
.btn-warning:hover { background:var(--clr-warning); color:#fff; }
.info-box-warning { background:#fef3c7; color:#92400e; border-radius:var(--radius-md); padding:10px 14px; font-size:0.8125rem; }
</style>