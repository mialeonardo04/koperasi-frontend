<template>
  <div class="kelompok-page">

    <!-- STATE: Belum punya kelompok -->
    <div v-if="!loading && !kelompok" class="empty-card card">
      <div class="empty-icon"><Users :size="40" style="opacity:0.3"/></div>
      <h3>Belum Tergabung Kelompok</h3>
      <p class="text-muted text-sm" style="margin-top:6px;max-width:380px;text-align:center">
        Buat kelompok baru atau minta leader untuk menambahkan kamu ke kelompok mereka.
      </p>
      <button class="btn btn-primary" style="margin-top:1.25rem" @click="showBuat=true">
        <Plus :size="16"/> Buat Kelompok
      </button>
    </div>

    <!-- STATE: Loading -->
    <div v-else-if="loading" class="loading-state"><div class="spinner" style="width:28px;height:28px"/></div>

    <!-- STATE: Punya kelompok -->
    <template v-else-if="kelompok">

      <!-- Header kelompok -->
      <div class="kelompok-header card" style="margin-bottom:1.25rem">
        <div class="kh-top">
          <div>
            <div class="kode-badge">{{ kelompok.kodeKelompok }}</div>
            <h2 style="margin-top:6px">{{ kelompok.namaKelompok }}</h2>
            <p class="text-muted text-sm" v-if="kelompok.deskripsi">{{ kelompok.deskripsi }}</p>
          </div>
          <span class="badge" :class="kelompok.status==='AKTIF'?'badge-success':'badge-neutral'">
            {{ kelompok.status }}
          </span>
        </div>
        <div class="kh-info">
          <div class="kh-stat"><span>Pembuat Kelompok</span><strong>{{ kelompok.namaLeader }}</strong></div>
          <div class="kh-stat"><span>Anggota</span><strong>{{ kelompok.jumlahAnggota }} orang</strong></div>
        </div>
        <!-- Tombol tambah anggota jika leader -->
        <div v-if="isLeader && kelompok.status==='AKTIF'" style="margin-top:1rem;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" @click="openTambahAnggota">
            <UserPlus :size="14"/> Tambah Anggota
          </button>
          <button
            v-if="bolehBubar"
            class="btn btn-danger btn-sm"
            @click="showBubarkan=true"
          >
            <X :size="14"/> Bubarkan Kelompok
          </button>
        </div>
      </div>

      <div class="grid-2" style="align-items:start">

        <!-- Daftar anggota -->
        <div class="card">
          <h4 style="margin-bottom:1rem">Anggota Kelompok</h4>
          <div class="anggota-list">
            <div class="anggota-item" v-for="a in kelompok.anggotaList" :key="a.id">
              <div class="anggota-avatar">{{ initials(a.namaLengkap) }}</div>
              <div class="anggota-info">
                <div class="anggota-name">
                  {{ a.namaLengkap }}
                  <span class="leader-badge" v-if="a.isLeader">👑 Pembuat Kelompok</span>
                </div>
                <div class="text-xs text-muted mono-text">{{ a.nomorAnggota }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pinjaman & Angsuran -->
        <div>
          <!-- Belum ada pinjaman -->
          <div class="card" v-if="!kelompok.pinjamanAktif && kelompok.status==='AKTIF'">
            <h4 style="margin-bottom:0.75rem">Pinjaman Kelompok</h4>
            <p class="text-muted text-sm">Belum ada pinjaman aktif.</p>

            <!-- Peringatan jika anggota kurang dari 2 -->
            <div v-if="kelompok.jumlahAnggota < 2" class="warning-box" style="margin-top:0.75rem">
              ⚠️ Minimal <strong>2 anggota</strong> diperlukan untuk mengajukan pinjaman.
              Tambahkan anggota terlebih dahulu.
            </div>

            <button v-else class="btn btn-primary btn-sm" style="margin-top:0.75rem" @click="showAjukanPinjaman=true">
              <Banknote :size="14"/> Ajukan Pinjaman
            </button>
          </div>

          <!-- Ada pinjaman -->
          <div class="card" v-else-if="kelompok.pinjamanAktif">
            <div class="pinjaman-header">
              <div>
                <p class="mono-text text-xs text-muted">{{ kelompok.pinjamanAktif.noPinjaman }}</p>
                <h4>{{ kelompok.pinjamanAktif.tujuanPinjaman || 'Pinjaman Kelompok' }}</h4>
              </div>
              <span class="badge" :class="statusBadge(kelompok.pinjamanAktif.status).class">
                {{ statusBadge(kelompok.pinjamanAktif.status).label }}
              </span>
            </div>
            <div class="pinjaman-stats">
              <div class="ps-item"><span>Jumlah</span><strong class="money">{{ formatRupiah(kelompok.pinjamanAktif.jumlahPinjaman) }}</strong></div>
              <div class="ps-item"><span>Sisa</span><strong class="money money-negative">{{ formatRupiah(kelompok.pinjamanAktif.sisaPinjaman) }}</strong></div>
              <div class="ps-item"><span>Angsuran/bln</span><strong class="money">{{ formatRupiah(kelompok.pinjamanAktif.angsuranPerBulan) }}</strong></div>
              <div class="ps-item"><span>Tenor</span><strong>{{ kelompok.pinjamanAktif.tenorBulan }} bulan</strong></div>
            </div>

            <!-- Jadwal angsuran -->
            <div v-if="jadwalAngsuran.length" style="margin-top:1.25rem">
              <h5 style="margin-bottom:0.75rem">Jadwal Angsuran</h5>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Ke-</th><th>Jatuh Tempo</th><th>Total</th><th>Status</th><th>Dibayar Oleh</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="a in jadwalAngsuran" :key="a.id" :class="{'row-terlambat': a.terlambat}">
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
                        <div v-else-if="kelompok.pinjamanAktif.status==='DISETUJUI'" style="display:flex;flex-direction:column;gap:6px;min-width:160px">
                          <!-- Pilih metode bayar -->
                          <select v-model="metodeBayar[a.id]" class="form-input form-select" style="font-size:0.75rem;padding:4px 8px"
                            @change="onMetodeBayarChange(a.id)">
                            <option value="TRANSFER">Transfer (Bukti)</option>
                            <option value="SIMPANAN">Dari Saldo Simpanan</option>
                          </select>
                          <!-- Upload bukti jika TRANSFER (default) -->
                          <BuktiBayarUploader v-if="!metodeBayar[a.id] || metodeBayar[a.id]==='TRANSFER'" v-model="buktiBayar[a.id]" />
                          <p class="form-error" v-if="bayarAttempted[a.id] && metodeBayar[a.id]!=='SIMPANAN' && !buktiBayar[a.id]" style="font-size:0.75rem">
                            ⚠️ Upload bukti terlebih dahulu
                          </p>
                          <!-- Pilih jenis simpanan jika SIMPANAN -->
                          <div v-if="metodeBayar[a.id]==='SIMPANAN'">
                            <select v-model="jenisSimpanan[a.id]" class="form-input form-select" style="font-size:0.75rem;padding:4px 8px">
                              <option value="">Pilih jenis simpanan...</option>
                              <option value="SUKARELA">Simpanan Sukarela</option>
                              <option value="WAJIB">Simpanan Wajib</option>
                              <option value="POKOK">Simpanan Pokok</option>
                            </select>
                            <p v-if="bayarAttempted[a.id] && !jenisSimpanan[a.id]" class="form-error" style="font-size:0.75rem">
                              ⚠️ Pilih jenis simpanan
                            </p>
                          </div>
                          <button class="btn btn-primary btn-sm" :disabled="bayarLoading===a.id" @click="ajukanBayar(a)">
                            <span class="spinner" v-if="bayarLoading===a.id" style="width:12px;height:12px"/>
                            <span v-else><Send :size="12"/> Bayar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Teguran dari admin -->
          <div class="card" v-if="teguranList.length" style="margin-top:1rem">
            <h4 style="margin-bottom:0.75rem">⚠️ Teguran dari Admin</h4>
            <div class="teguran-list">
              <div class="teguran-item" v-for="t in teguranList" :key="t.id">
                <p class="text-sm">{{ t.pesan }}</p>
                <p class="text-xs text-muted" style="margin-top:4px">{{ formatDateTime(t.sentAt) }} — {{ t.namaAdmin }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: Konfirmasi Bubarkan Kelompok -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showBubarkan" @click.self="showBubarkan=false">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3>Bubarkan Kelompok?</h3>
            <button class="btn-icon-close" @click="showBubarkan=false"><X :size="18"/></button>
          </div>
          <div class="modal-icon-wrap modal-icon-danger" style="width:52px;height:52px;border-radius:50%;background:var(--clr-danger-bg);color:var(--clr-danger);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
            <X :size="24"/>
          </div>
          <p class="text-sm text-muted" style="text-align:center;margin-bottom:1.25rem">
            Kelompok <strong>{{ kelompok?.namaKelompok }}</strong> akan dibubarkan.<br/>
            Semua anggota tidak bisa lagi menggunakan kelompok ini.<br/>
            <strong style="color:var(--clr-danger)">Tindakan ini tidak bisa dibatalkan.</strong>
          </p>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showBubarkan=false">Batal</button>
            <button class="btn btn-danger" :disabled="bubarkanLoading" @click="submitBubarkan">
              <span class="spinner" v-if="bubarkanLoading" style="width:14px;height:14px;border-width:2px"/>
              <span v-else>Ya, Bubarkan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Buat Kelompok -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showBuat" @click.self="showBuat=false">
        <div class="modal" style="max-width:440px">
          <div class="modal-header">
            <h3>Buat Kelompok Baru</h3>
            <button class="btn-icon-close" @click="showBuat=false"><X :size="18"/></button>
          </div>
          <div class="info-box" style="margin-bottom:1rem;font-size:0.8125rem">
            💡 Anda akan otomatis menjadi leader. Minimal 2 anggota diperlukan untuk mengajukan pinjaman.
          </div>
          <form @submit.prevent="submitBuat">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">Nama Kelompok <span class="required-mark">*</span></label>
                <input v-model="buatForm.namaKelompok" type="text" class="form-input" placeholder="Contoh: Kelompok Usaha Maju" required minlength="3" />
              </div>
              <div class="form-group">
                <label class="form-label">Deskripsi <span class="text-muted">(opsional)</span></label>
                <textarea v-model="buatForm.deskripsi" class="form-input" rows="2" placeholder="Tujuan kelompok..." />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showBuat=false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span class="spinner" v-if="submitting"/><span v-else>Buat Kelompok</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Tambah Anggota -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTambahAnggota" @click.self="closeTambahAnggota()">
        <div class="modal" style="max-width:520px">
          <div class="modal-header">
            <h3>Tambah Anggota</h3>
            <button class="btn-icon-close" @click="closeTambahAnggota()"><X :size="18"/></button>
          </div>

          <!-- Search filter -->
          <div style="position:relative;margin-bottom:10px">
            <Search :size="15" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--clr-text-3);pointer-events:none"/>
            <input v-model="memberFilterText" type="text" class="form-input" style="padding-left:36px" placeholder="Cari nama anggota..." />
          </div>

          <!-- Loading -->
          <div v-if="loadingMemberBebas" style="text-align:center;padding:1.5rem">
            <div class="spinner" style="margin:0 auto"/>
          </div>

          <!-- Empty -->
          <div v-else-if="memberBebasFiltered.length === 0" class="empty-member-list">
            <Users :size="28" style="opacity:0.3;margin-bottom:6px"/>
            <p class="text-sm text-muted">Semua anggota sudah tergabung kelompok aktif</p>
          </div>

          <!-- Tabel member bebas -->
          <div v-else class="member-table-wrap">
            <table class="member-checkbox-table">
              <thead>
                <tr>
                  <th style="width:36px">
                    <input type="checkbox"
                      :checked="selectedMemberIds.length === memberBebasFiltered.length && memberBebasFiltered.length > 0"
                      :indeterminate="selectedMemberIds.length > 0 && selectedMemberIds.length < memberBebasFiltered.length"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>Nama</th>
                  <th>No. Anggota</th>
                  <th>Simpanan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in memberBebasFiltered" :key="m.id"
                    :class="{'row-selected': selectedMemberIds.includes(m.id)}"
                    @click="toggleSelectMember(m.id)" style="cursor:pointer">
                  <td @click.stop>
                    <input type="checkbox"
                      :checked="selectedMemberIds.includes(m.id)"
                      @change="toggleSelectMember(m.id)"
                    />
                  </td>
                  <td class="font-medium">{{ m.namaLengkap }}</td>
                  <td class="mono-text text-sm">{{ m.nomorAnggota }}</td>
                  <td class="money text-sm">{{ formatRupiah(m.totalSimpanan) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="selected-info" v-if="selectedMemberIds.length > 0">
            {{ selectedMemberIds.length }} anggota dipilih
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeTambahAnggota()">Batal</button>
            <button class="btn btn-primary" :disabled="submitting || selectedMemberIds.length === 0" @click="submitTambahAnggotaMulti">
              <span class="spinner" v-if="submitting"/><span v-else>Tambah ({{ selectedMemberIds.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Ajukan Pinjaman -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showAjukanPinjaman" @click.self="showAjukanPinjaman=false">
        <div class="modal" style="max-width:440px">
          <div class="modal-header">
            <h3>Ajukan Pinjaman Kelompok</h3>
            <button class="btn-icon-close" @click="showAjukanPinjaman=false"><X :size="18"/></button>
          </div>
          <div class="info-box" style="margin-bottom:1rem;font-size:0.8125rem">
            💡 Maksimal pinjaman <strong>Rp 3.000.000</strong> dengan tenor maksimal <strong>10 bulan</strong>
          </div>
          <form @submit.prevent="submitAjukanPinjaman">
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div class="form-group">
                <label class="form-label">Jumlah Pinjaman <span class="required-mark">*</span></label>
                <CurrencyInput v-model="pinjamanForm.jumlahPinjaman" :min="100000" :max="3000000" :required="true" placeholder="Maks Rp 3.000.000"/>
                <p class="form-hint">Rp 100.000 – Rp 3.000.000</p>
              </div>
              <div class="form-group">
                <label class="form-label">Tenor <span class="required-mark">*</span></label>
                <select v-model.number="pinjamanForm.tenorBulan" class="form-input form-select" required>
                  <option v-for="t in [1,2,3,4,5,6,7,8,9,10]" :key="t" :value="t">{{ t }} bulan</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tujuan Pinjaman</label>
                <input v-model="pinjamanForm.tujuanPinjaman" type="text" class="form-input" placeholder="Misal: Modal usaha bersama" />
              </div>
              <div class="estimasi-box" v-if="pinjamanForm.jumlahPinjaman && pinjamanForm.tenorBulan">
                <p class="text-xs text-muted" style="margin-bottom:4px">Estimasi angsuran (bunga 1.5%/bulan)</p>
                <p class="money font-semibold" style="font-size:1.125rem;color:var(--clr-primary)">
                  ≈ {{ formatRupiah(estimasiAngsuran) }} / bulan
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showAjukanPinjaman=false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span class="spinner" v-if="submitting"/><span v-else>Ajukan Pinjaman</span>
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
import { Users, Plus, UserPlus, Banknote, Send, X, Search } from 'lucide-vue-next'
import { kelompokApi } from '@/services/api'
import { formatRupiah, formatDate, formatDateTime, statusBadge } from '@/services/helpers'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'
import BuktiBayarUploader from '@/components/BuktiBayarUploader.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const auth        = useAuthStore()
const kelompok    = ref(null)
const loading     = ref(true)
const submitting  = ref(false)
const teguranList = ref([])
const jadwalAngsuran = ref([])

const showBuat          = ref(false)
const showTambahAnggota = ref(false)
const showAjukanPinjaman = ref(false)
const showBubarkan        = ref(false)
const bubarkanLoading     = ref(false)

// Member search untuk tambah anggota
const memberBebasAll       = ref([])
const memberFilterText     = ref('')
const loadingMemberBebas   = ref(false)
const selectedMemberIds    = ref([])

const buatForm        = ref({ namaKelompok: '', deskripsi: '' })
const tambahAnggotaForm = ref({ userId: null })
const pinjamanForm    = ref({ jumlahPinjaman: null, tenorBulan: 6, tujuanPinjaman: '' })

const metodeBayar  = ref({})
const jenisSimpanan = ref({})
const buktiBayar   = ref({})
const bayarLoading = ref(null)
const bayarAttempted = ref({})

const memberBebasFiltered = computed(() => {
  if (!memberFilterText.value.trim()) return memberBebasAll.value
  const q = memberFilterText.value.toLowerCase()
  return memberBebasAll.value.filter(m =>
    m.namaLengkap.toLowerCase().includes(q) || m.nomorAnggota.toLowerCase().includes(q)
  )
})

const isLeader = computed(() =>
  kelompok.value && auth.user && kelompok.value.leaderId === auth.user.id
)

// Boleh bubar jika tidak ada pinjaman PENDING atau DISETUJUI
const bolehBubar = computed(() => {
  if (!kelompok.value) return false
  const p = kelompok.value.pinjamanAktif
  if (!p) return true  // belum pernah pinjam
  return p.status === 'DITOLAK' || p.status === 'LUNAS'
})

const estimasiAngsuran = computed(() => {
  const P = pinjamanForm.value.jumlahPinjaman
  const n = pinjamanForm.value.tenorBulan
  if (!P || !n) return 0
  const r   = 1.5 / 100
  const pow = Math.pow(1 + r, n)
  return Math.round(P * r * pow / (pow - 1))
})

function onMetodeBayarChange(id) {
  if (metodeBayar.value[id] === 'TRANSFER') {
    jenisSimpanan.value[id] = ''
  }
}

function initials(name) {
  return (name || '').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
}

function statusAngsuranClass(s) {
  return { BELUM_BAYAR:'badge-warning', SUDAH_BAYAR:'badge-success', TERLAMBAT:'badge-danger' }[s] || 'badge-neutral'
}

function statusAngsuranLabel(s) {
  return { BELUM_BAYAR:'Belum Bayar', SUDAH_BAYAR:'Sudah Bayar', TERLAMBAT:'Terlambat' }[s] || s
}

async function load() {
  loading.value = true
  try {
    const res = await kelompokApi.saya()
    kelompok.value = res.data.data

    // Jadwal angsuran dari pinjaman aktif
    if (kelompok.value.pinjamanAktif?.status === 'DISETUJUI') {
      jadwalAngsuran.value = kelompok.value.pinjamanAktif?.jadwalAngsuran ?? []
    }

    // Load teguran
    const tr = await kelompokApi.teguran(kelompok.value.id)
    teguranList.value = tr.data.data
  } catch (e) {
    kelompok.value = null
  } finally {
    loading.value = false
  }
}

async function submitBuat() {
  submitting.value = true
  try {
    await kelompokApi.buat(buatForm.value)
    toast.success('Kelompok berhasil dibuat!')
    showBuat.value = false
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal membuat kelompok')
  } finally { submitting.value = false }
}

async function submitTambahAnggota() {
  submitting.value = true
  try {
    await kelompokApi.tambahAnggota(kelompok.value.id, tambahAnggotaForm.value)
    toast.success('Anggota berhasil ditambahkan!')
    closeTambahAnggota()
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal menambahkan anggota')
  } finally { submitting.value = false }
}

async function submitAjukanPinjaman() {
  submitting.value = true
  try {
    await kelompokApi.ajukanPinjaman(kelompok.value.id, pinjamanForm.value)
    toast.success('Pengajuan pinjaman kelompok berhasil dikirim!')
    showAjukanPinjaman.value = false
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mengajukan pinjaman')
  } finally { submitting.value = false }
}

async function ajukanBayar(a) {
  bayarAttempted.value = { ...bayarAttempted.value, [a.id]: true }
  const metode = metodeBayar.value[a.id] || 'TRANSFER'
  if (metode === 'TRANSFER' && !buktiBayar.value[a.id]) return
  if (metode === 'SIMPANAN' && !jenisSimpanan.value[a.id]) return

  bayarLoading.value = a.id
  try {
    await kelompokApi.bayarAngsuran({
      angsuranId:    a.id,
      metodeBayar:   metode,
      buktiBayar:    buktiBayar.value[a.id] || null,
      jenisSimpanan: metode === 'SIMPANAN' ? jenisSimpanan.value[a.id] : null,
      keterangan:    metode === 'SIMPANAN' ? 'Bayar dari simpanan ' + jenisSimpanan.value[a.id] : null
    })
    toast.success(`Pengajuan bayar angsuran ke-${a.periodeKe} dikirim!`)
    bayarAttempted.value = { ...bayarAttempted.value, [a.id]: false }
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mengajukan pembayaran')
  } finally { bayarLoading.value = null }
}

async function submitBubarkan() {
  bubarkanLoading.value = true
  try {
    await kelompokApi.bubarkanKelompok(kelompok.value.id)
    toast.success('Kelompok berhasil dibubarkan.')
    showBubarkan.value = false
    kelompok.value = null
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal membubarkan kelompok')
  } finally {
    bubarkanLoading.value = false
  }
}

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

async function openTambahAnggota() {
  selectedMemberIds.value = []
  memberFilterText.value  = ''
  showTambahAnggota.value = true
  loadingMemberBebas.value = true
  try {
    const res = await kelompokApi.memberBebas()
    // Filter: jangan tampilkan anggota yang sudah ada di kelompok ini
    const anggotaIds = kelompok.value?.anggotaList?.map(a => a.id) ?? []
    memberBebasAll.value = (res.data.data ?? []).filter(m => !anggotaIds.includes(m.id))
  } catch { memberBebasAll.value = [] }
  finally { loadingMemberBebas.value = false }
}

function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedMemberIds.value = memberBebasFiltered.value.map(m => m.id)
  } else {
    selectedMemberIds.value = []
  }
}

function toggleSelectMember(id) {
  const idx = selectedMemberIds.value.indexOf(id)
  if (idx >= 0) selectedMemberIds.value.splice(idx, 1)
  else selectedMemberIds.value.push(id)
}

async function submitTambahAnggotaMulti() {
  if (selectedMemberIds.value.length === 0) return
  submitting.value = true
  try {
    for (const userId of selectedMemberIds.value) {
      await kelompokApi.tambahAnggota(kelompok.value.id, { userId })
    }
    toast.success(`${selectedMemberIds.value.length} anggota berhasil ditambahkan!`)
    closeTambahAnggota()
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal menambahkan anggota')
  } finally { submitting.value = false }
}

function closeTambahAnggota() {
  showTambahAnggota.value = false
  memberFilterText.value  = ''
  selectedMemberIds.value = []
}

function onMemberSearch() {
  clearTimeout(memberSearchTimer)
  tambahAnggotaForm.value.userId = null
  selectedMemberName.value = ''
  if (!memberSearchText.value || memberSearchText.value.length < 2) {
    memberSuggestions.value = []
    return
  }
  memberSearchTimer = setTimeout(async () => {
    try {
      const res = await kelompokApi.cariMember({ search: memberSearchText.value, page: 0, size: 8 })
      // Filter: jangan tampilkan anggota yang sudah ada di kelompok ini
      const anggotaIds = kelompok.value?.anggotaList?.map(a => a.id) ?? []
      const content = res.data.data?.content ?? res.data.data?.page?.content ?? []
        memberSuggestions.value = content.filter(
        m => !anggotaIds.includes(m.id)
      )
    } catch {}
  }, 300)
}

function selectMember(m) {
  tambahAnggotaForm.value.userId = m.id
  selectedMemberName.value       = m.namaLengkap
  memberSearchText.value         = m.namaLengkap
  memberSuggestions.value        = []
  showMemberSuggestions.value    = false
}

onMounted(load)
</script>

<style scoped>
.empty-card { text-align:center; padding:3rem 2rem; display:flex; flex-direction:column; align-items:center; }
.kelompok-header .kh-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; }
.kode-badge { display:inline-block; font-family:var(--font-mono); font-size:0.75rem; background:var(--clr-surface-2); border:1px solid var(--clr-border); padding:2px 10px; border-radius:var(--radius-full); color:var(--clr-text-2); }
.kh-info { display:flex; gap:2rem; }
.kh-stat { display:flex; flex-direction:column; gap:2px; font-size:0.875rem; }
.kh-stat span { color:var(--clr-text-3); font-size:0.75rem; }
.anggota-list { display:flex; flex-direction:column; gap:10px; }
.anggota-item { display:flex; align-items:center; gap:12px; }
.anggota-avatar { width:36px; height:36px; border-radius:50%; background:var(--clr-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.875rem; font-weight:700; flex-shrink:0; }
.anggota-name { display:flex; align-items:center; gap:6px; font-weight:500; font-size:0.9375rem; }
.leader-badge { font-size:0.6875rem; background:var(--clr-accent-light); color:#92400e; border:1px solid rgba(180,120,0,0.3); padding:2px 10px; border-radius:var(--radius-full); font-weight:700; letter-spacing:0.01em; }
.pinjaman-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; }
.pinjaman-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; background:var(--clr-surface-2); padding:12px; border-radius:var(--radius-md); }
.ps-item { display:flex; flex-direction:column; gap:3px; font-size:0.875rem; }
.ps-item span { color:var(--clr-text-3); font-size:0.75rem; }
.teguran-list { display:flex; flex-direction:column; gap:10px; }
.teguran-item { background:var(--clr-danger-bg); border-left:3px solid var(--clr-danger); padding:10px 14px; border-radius:0 var(--radius-md) var(--radius-md) 0; }
.row-terlambat td { background:rgba(220,38,38,0.04); }
.estimasi-box { background:var(--clr-primary-light); border-radius:var(--radius-md); padding:12px 16px; }
.btn-icon-close { background:none; border:none; cursor:pointer; color:var(--clr-text-3); padding:4px; border-radius:var(--radius-sm); }
.btn-icon-close:hover { background:var(--clr-surface-2); color:var(--clr-text); }
.required-mark { color:var(--clr-danger); }
.form-error { font-size:0.75rem; color:var(--clr-danger); margin-top:4px; }
.warning-box { background:var(--clr-accent-light); border:1px solid rgba(180,120,0,0.25); border-radius:var(--radius-md); padding:10px 14px; font-size:0.8125rem; color:#92400e; }
.member-table-wrap { max-height:280px; overflow-y:auto; border:1px solid var(--clr-border); border-radius:var(--radius-md); margin-bottom:10px; }
.member-checkbox-table { width:100%; border-collapse:collapse; font-size:0.875rem; }
.member-checkbox-table th { background:var(--clr-surface-2); padding:8px 10px; text-align:left; font-size:0.75rem; color:var(--clr-text-3); font-weight:600; text-transform:uppercase; position:sticky; top:0; z-index:1; }
.member-checkbox-table td { padding:8px 10px; border-top:1px solid var(--clr-border); }
.member-checkbox-table tr.row-selected td { background:var(--clr-primary-light); }
.member-checkbox-table tbody tr:hover td { background:var(--clr-surface-2); }
.member-checkbox-table input[type=checkbox] { width:15px; height:15px; cursor:pointer; accent-color:var(--clr-primary); }
.selected-info { font-size:0.8125rem; color:var(--clr-primary); font-weight:600; margin-bottom:10px; }
.empty-member-list { text-align:center; padding:1.5rem; display:flex; flex-direction:column; align-items:center; }
.suggestions { position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:100; background:var(--clr-surface); border:1px solid var(--clr-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); overflow:hidden; max-height:220px; overflow-y:auto; }
.suggestion-item { padding:10px 14px; cursor:pointer; transition:background var(--transition); }
.suggestion-item:hover { background:var(--clr-surface-2); }
.suggestion-name { font-size:0.875rem; font-weight:500; }
.mono-text { font-family:var(--font-mono); }
</style>