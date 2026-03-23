<template>
  <div class="admin-kelompok">
    <!-- Header Aksi -->
    <div class="card" style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
      <h4 style="margin:0">Manajemen Kelompok</h4>
      <button class="btn btn-primary btn-sm" @click="openBuatKelompok">
        <Plus :size="14"/> Buat Kelompok
      </button>
    </div>

    <!-- Tabel kelompok -->
    <div class="card" style="padding:0">
      <div v-if="loading" class="loading-center"><div class="spinner"/></div>
      <div v-else-if="rows.length===0" class="empty-state">
        <Users :size="36" style="opacity:0.25"/><p>Belum ada kelompok</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Kelompok</th>
              <th>Leader</th>
              <th>Anggota</th>
              <th>Status</th>
              <th>Pinjaman Aktif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td><span class="mono-text">{{ r.kodeKelompok }}</span></td>
              <td class="font-medium">{{ r.namaKelompok }}</td>
              <td class="text-sm">{{ r.namaLeader }}</td>
              <td class="text-sm">{{ r.jumlahAnggota }} orang</td>
              <td><span class="badge" :class="r.status==='AKTIF'?'badge-success':'badge-neutral'">{{ r.status }}</span></td>
              <td>
                <span v-if="r.pinjamanAktif" class="text-sm">
                  <span class="money font-semibold">{{ formatRupiah(r.pinjamanAktif.jumlahPinjaman) }}</span>
                  <span class="badge badge-sm ml-1" :class="statusBadge(r.pinjamanAktif.status).class">
                    {{ statusBadge(r.pinjamanAktif.status).label }}
                  </span>
                </span>
                <span v-else class="text-xs text-muted">-</span>
              </td>
              <td>
                <div class="action-row">
                  <button class="btn btn-ghost btn-sm" @click="openDetail(r)" title="Detail"><Eye :size="14"/></button>
                  <button v-if="r.pinjamanAktif?.status==='PENDING'" class="btn btn-primary btn-sm" @click="openProsesPinjaman(r)">Proses</button>
                  <button v-if="r.status==='AKTIF'" class="btn btn-warning btn-sm" @click="openTeguran(r)">Teguran</button>
                  <button v-if="r.status==='AKTIF'" class="btn btn-ghost btn-sm" @click="openGantiLeader(r)" title="Ganti Leader"><UserCheck :size="14"/></button>
                  <button v-if="r.status==='AKTIF'" class="btn btn-ghost btn-sm" @click="openTambahAnggota(r)" title="Tambah Anggota"><UserPlus :size="14"/></button>
                  <button v-if="r.status==='AKTIF'" class="btn btn-ghost btn-sm" @click="openPencairan(r)" title="Kelola Pencairan"><Wallet :size="14"/></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detail -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showDetail" @click.self="showDetail=false">
        <div class="modal" style="max-width:620px">
          <div class="modal-header">
            <h3>Detail Kelompok — {{ selected?.kodeKelompok }}</h3>
            <button class="btn-icon-close" @click="showDetail=false"><X :size="18"/></button>
          </div>
          <div v-if="detailData">
            <!-- Anggota -->
            <h5 style="margin-bottom:8px">Anggota ({{ detailData.jumlahAnggota }})</h5>
            <div class="anggota-chips">
              <span class="anggota-chip" v-for="a in detailData.anggotaList" :key="a.id">
                {{ a.namaLengkap }}
                <span v-if="a.isLeader" class="leader-tag">Leader</span>
              </span>
            </div>
            <!-- Pinjaman -->
            <div v-if="detailData.pinjamanAktif" style="margin-top:1.25rem">
              <h5 style="margin-bottom:8px">Pinjaman Aktif</h5>
              <div class="detail-pinjaman-grid">
                <div class="dp-row"><span>No. Pinjaman</span><span class="mono-text">{{ detailData.pinjamanAktif.noPinjaman }}</span></div>
                <div class="dp-row"><span>Jumlah</span><span class="money font-semibold">{{ formatRupiah(detailData.pinjamanAktif.jumlahPinjaman) }}</span></div>
                <div class="dp-row"><span>Sisa</span><span class="money money-negative">{{ formatRupiah(detailData.pinjamanAktif.sisaPinjaman) }}</span></div>
                <div class="dp-row"><span>Angsuran/bln</span><span class="money">{{ formatRupiah(detailData.pinjamanAktif.angsuranPerBulan) }}</span></div>
                <div class="dp-row"><span>Status</span><span class="badge badge-sm" :class="statusBadge(detailData.pinjamanAktif.status).class">{{ statusBadge(detailData.pinjamanAktif.status).label }}</span></div>
                <div class="dp-row"><span>Jatuh Tempo</span><span>{{ formatDate(detailData.pinjamanAktif.tanggalJatuhTempo) || '-' }}</span></div>
              </div>

              <!-- Jadwal Angsuran -->
              <div v-if="detailData.pinjamanAktif.jadwalAngsuran?.length" style="margin-top:1rem">
                <h5 style="margin-bottom:8px">Jadwal Angsuran</h5>
                <div class="table-wrap" style="max-height:240px;overflow-y:auto">
                  <table>
                    <thead><tr><th>Ke-</th><th>Jatuh Tempo</th><th>Total</th><th>Status</th><th>Dibayar Oleh</th></tr></thead>
                    <tbody>
                      <tr v-for="a in detailData.pinjamanAktif.jadwalAngsuran" :key="a.id" :class="{'row-terlambat':a.terlambat}">
                        <td>{{ a.periodeKe }}</td>
                        <td class="text-sm">{{ formatDate(a.tanggalJatuhTempo) }}</td>
                        <td class="money">{{ formatRupiah(a.jumlahAngsuran) }}</td>
                        <td><span class="badge badge-sm" :class="statusAngsuranClass(a.status)">{{ a.terlambat?'⚠️ Terlambat':a.status }}</span></td>
                        <td class="text-sm">{{ a.dibayarOleh || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Proses Pinjaman -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showProses" @click.self="showProses=false">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3>Proses Pinjaman Kelompok</h3>
            <button class="btn-icon-close" @click="showProses=false"><X :size="18"/></button>
          </div>
          <div class="confirm-detail" v-if="selected?.pinjamanAktif">
            <div class="confirm-row"><span>Kelompok</span><strong>{{ selected.namaKelompok }}</strong></div>
            <div class="confirm-row"><span>Pengaju</span><strong>{{ selected.pinjamanAktif.namaPengaju }}</strong></div>
            <div class="confirm-row"><span>Jumlah</span><strong class="money">{{ formatRupiah(selected.pinjamanAktif.jumlahPinjaman) }}</strong></div>
            <div class="confirm-row"><span>Tenor</span><strong>{{ selected.pinjamanAktif.tenorBulan }} bulan</strong></div>
            <div class="confirm-row"><span>Tujuan</span><strong>{{ selected.pinjamanAktif.tujuanPinjaman || '-' }}</strong></div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Catatan Admin <span class="text-muted">(opsional)</span></label>
            <textarea v-model="prosesNote" class="form-input" rows="2" />
          </div>
          <div class="modal-footer" style="gap:8px">
            <button class="btn btn-secondary" @click="showProses=false">Batal</button>
            <button class="btn btn-danger" :disabled="submitting" @click="submitProses(false)">
              <span class="spinner" v-if="submitting==='tolak'"/><span v-else>Tolak</span>
            </button>
            <button class="btn btn-success-confirm" :disabled="submitting" @click="submitProses(true)">
              <span class="spinner" v-if="submitting==='setujui'"/><span v-else>Setujui</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Teguran -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTeguranModal" @click.self="showTeguranModal=false">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3>Kirim Teguran ke {{ selected?.namaKelompok }}</h3>
            <button class="btn-icon-close" @click="showTeguranModal=false"><X :size="18"/></button>
          </div>
          <p class="text-sm text-muted" style="margin-bottom:1rem">
            Pesan akan dikirim ke semua anggota kelompok via Telegram.
          </p>
          <div class="form-group">
            <label class="form-label">Pesan Teguran <span class="required-mark">*</span></label>
            <textarea v-model="teguranPesan" class="form-input" rows="4"
              placeholder="Contoh: Angsuran bulan ini sudah melewati jatuh tempo. Harap segera melakukan pembayaran." />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showTeguranModal=false">Batal</button>
            <button class="btn btn-danger" :disabled="submitting" @click="submitTeguran">
              <span class="spinner" v-if="submitting"/><span v-else>Kirim Teguran</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Buat Kelompok (Admin) -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showBuatKelompok" @click.self="showBuatKelompok=false">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <h3>Buat Kelompok Baru</h3>
            <button class="btn-icon-close" @click="showBuatKelompok=false"><X :size="18"/></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nama Kelompok <span class="text-danger">*</span></label>
              <input v-model="formBuat.namaKelompok" class="form-input" placeholder="Contoh: Kelompok Mawar" />
            </div>
            <div class="form-group">
              <label class="form-label">Leader (Member) <span class="text-danger">*</span></label>
              <select v-model="formBuat.leaderId" class="form-input">
                <option value="" disabled>-- Pilih Leader --</option>
                <option v-for="m in memberBebas" :key="m.id" :value="m.id">
                  {{ m.namaLengkap }} ({{ m.nomorAnggota }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi</label>
              <input v-model="formBuat.deskripsi" class="form-input" placeholder="Opsional" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showBuatKelompok=false">Batal</button>
            <button class="btn btn-primary" @click="submitBuatKelompok" :disabled="submitLoading">
              <span v-if="submitLoading" class="spinner" style="width:12px;height:12px;border-width:2px"/>
              <span v-else>Buat Kelompok</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Ganti Leader -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showGantiLeader" @click.self="showGantiLeader=false">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3>Ganti Leader — {{ selectedKelompok?.namaKelompok }}</h3>
            <button class="btn-icon-close" @click="showGantiLeader=false"><X :size="18"/></button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted" style="margin-bottom:1rem">
              Leader saat ini: <strong>{{ selectedKelompok?.namaLeader }}</strong>
            </p>
            <div class="form-group">
              <label class="form-label">Pilih Leader Baru <span class="text-danger">*</span></label>
              <select v-model="formGantiLeader.newLeaderId" class="form-input">
                <option value="" disabled>-- Pilih Anggota --</option>
                <option v-for="a in anggotaKelompok" :key="a.id" :value="a.id">
                  {{ a.namaLengkap }} {{ a.isLeader ? '(Leader Saat Ini)' : '' }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showGantiLeader=false">Batal</button>
            <button class="btn btn-primary" @click="submitGantiLeader" :disabled="submitLoading">
              <span v-if="submitLoading" class="spinner" style="width:12px;height:12px;border-width:2px"/>
              <span v-else>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Tambah Anggota (Admin) -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showTambahAnggota" @click.self="showTambahAnggota=false">
        <div class="modal" style="max-width:520px">
          <div class="modal-header">
            <h3>Tambah Anggota — {{ selectedKelompok?.namaKelompok }}</h3>
            <button class="btn-icon-close" @click="showTambahAnggota=false"><X :size="18"/></button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-muted" style="margin-bottom:0.75rem">
              Pilih member yang akan ditambahkan ke kelompok ini.
            </p>
            <div class="member-table-wrap" style="max-height:280px;overflow-y:auto">
              <table>
                <thead><tr><th></th><th>No. Anggota</th><th>Nama</th></tr></thead>
                <tbody>
                  <tr v-for="m in memberBebas" :key="m.id">
                    <td><input type="checkbox" :value="m.id" v-model="formTambahAnggota.userIds" /></td>
                    <td class="mono-text text-sm">{{ m.nomorAnggota }}</td>
                    <td class="text-sm">{{ m.namaLengkap }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="memberBebas.length===0" class="text-sm text-muted text-center" style="padding:1rem">
              Tidak ada member bebas kelompok
            </p>
          </div>
          <div class="modal-footer">
            <span class="text-sm text-muted">{{ formTambahAnggota.userIds.length }} dipilih</span>
            <button class="btn btn-ghost" @click="showTambahAnggota=false">Batal</button>
            <button class="btn btn-primary" @click="submitTambahAnggota" :disabled="submitLoading||formTambahAnggota.userIds.length===0">
              <span v-if="submitLoading" class="spinner" style="width:12px;height:12px;border-width:2px"/>
              <span v-else>Tambah</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- Modal Kelola Pencairan (Admin) -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="showPencairan" @click.self="showPencairan=false">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <h3>Pencairan Dana — {{ selectedKelompok?.namaKelompok }}</h3>
            <button class="btn-icon-close" @click="showPencairan=false"><X :size="18"/></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingPencairan" class="loading-center"><div class="spinner"/></div>
            <div v-else-if="pencairanPendingList.length === 0" class="empty-state" style="padding:1.5rem">
              <p class="text-muted">Tidak ada request pencairan yang menunggu persetujuan</p>
            </div>
            <div v-else>
              <p class="text-sm text-muted" style="margin-bottom:1rem">
                {{ pencairanPendingList.length }} request pencairan menunggu persetujuan
              </p>
              <div v-for="p in pencairanPendingList" :key="p.id" class="pencairan-item">
                <div class="pencairan-info">
                  <span class="font-medium text-sm">{{ p.namaAnggota }}</span>
                  <span class="money font-semibold">{{ formatRupiah(p.jumlah) }}</span>
                </div>
                <p class="text-xs text-muted" v-if="p.keterangan">{{ p.keterangan }}</p>
                <div class="pencairan-actions">
                  <button class="btn btn-success btn-sm" @click="prosesPencairan(p.id, true)" :disabled="prosesLoading===p.id">
                    <span v-if="prosesLoading===p.id" class="spinner" style="width:10px;height:10px;border-width:2px"/>
                    <span v-else>✓ Setujui</span>
                  </button>
                  <button class="btn btn-danger btn-sm" @click="prosesPencairan(p.id, false)" :disabled="prosesLoading===p.id">
                    <span v-if="prosesLoading===p.id" class="spinner" style="width:10px;height:10px;border-width:2px"/>
                    <span v-else>✗ Tolak</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showPencairan=false">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>

</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Users, Eye, X, Plus, UserCheck, UserPlus, Wallet } from 'lucide-vue-next'
import { adminApi, adminKelompokApi, kelompokApi } from '@/services/api'
import { formatRupiah, formatDate, statusBadge, parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const rows      = ref([])
const loading   = ref(true)
const submitting = ref(false)
const selected  = ref(null)
const detailData = ref(null)

const showDetail  = ref(false)
const showProses  = ref(false)
const showTeguranModal = ref(false)
const prosesNote  = ref('')
const teguranPesan = ref('')

function statusAngsuranClass(s) {
  return { BELUM_BAYAR:'badge-warning', SUDAH_BAYAR:'badge-success', TERLAMBAT:'badge-danger' }[s] || 'badge-neutral'
}

async function load() {
  loading.value = true
  try {
    const res = await adminApi.allKelompok({ page: 0, size: 50 })
    rows.value = parsePage(res.data.data).content
  } finally { loading.value = false }
}

async function openDetail(r) {
  selected.value  = r
  detailData.value = null
  showDetail.value = true
  try {
    const res = await adminApi.kelompokDetail(r.id)
    detailData.value = res.data.data
  } catch {}
}

function openProsesPinjaman(r) {
  selected.value  = r
  prosesNote.value = ''
  showProses.value = true
}

function openTeguran(r) {
  selected.value    = r
  teguranPesan.value = ''
  showTeguranModal.value = true
}

async function submitProses(disetujui) {
  submitting.value = disetujui ? 'setujui' : 'tolak'
  try {
    await adminApi.prosesPinjamanKelompok(
      selected.value.pinjamanAktif.id, disetujui, prosesNote.value || undefined)
    toast.success(disetujui ? 'Pinjaman kelompok disetujui!' : 'Pinjaman kelompok ditolak')
    showProses.value = false
    await load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal memproses pinjaman')
  } finally { submitting.value = false }
}

async function submitTeguran() {
  if (!teguranPesan.value.trim()) { toast.error('Pesan teguran wajib diisi'); return }
  submitting.value = true
  try {
    await adminApi.kirimTeguran(selected.value.id, { pesan: teguranPesan.value })
    toast.success('Teguran berhasil dikirim ke semua anggota kelompok!')
    showTeguranModal.value = false
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal mengirim teguran')
  } finally { submitting.value = false }
}


// ── Admin Kelola Kelompok ─────────────────────────────────────
const showBuatKelompok   = ref(false)
const showGantiLeader    = ref(false)
const showTambahAnggota  = ref(false)
const selectedKelompok   = ref(null)
const memberBebas        = ref([])
const anggotaKelompok    = ref([])
const submitLoading      = ref(false)

const formBuat = ref({ namaKelompok: '', leaderId: '', deskripsi: '' })
const formGantiLeader = ref({ newLeaderId: '' })
const formTambahAnggota = ref({ userIds: [] })

async function loadMemberBebas() {
  try {
    const res = await kelompokApi.memberBebas()
    memberBebas.value = res.data.data || []
  } catch(e) { memberBebas.value = [] }
}


const showPencairan       = ref(false)
const pencairanPendingList = ref([])
const loadingPencairan    = ref(false)
const prosesLoading       = ref(null)

async function openPencairan(row) {
  selectedKelompok.value = row
  showPencairan.value = true
  loadingPencairan.value = true
  try {
    const res = await adminKelompokApi.getPencairanPending(row.id)
    pencairanPendingList.value = res.data.data || []
  } catch(e) {
    toast.error('Gagal load data pencairan')
  } finally {
    loadingPencairan.value = false
  }
}

async function prosesPencairan(pencairanId, disetujui) {
  prosesLoading.value = pencairanId
  try {
    await adminKelompokApi.prosesPencairan(pencairanId, { disetujui, keteranganAdmin: '' })
    toast.success(disetujui ? 'Pencairan disetujui!' : 'Pencairan ditolak!')
    // Refresh list
    await openPencairan(selectedKelompok.value)
    load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal proses pencairan')
  } finally {
    prosesLoading.value = null
  }
}

async function openBuatKelompok() {
  await loadMemberBebas()
  formBuat.value = { namaKelompok: '', leaderId: '', deskripsi: '' }
  showBuatKelompok.value = true
}

async function openGantiLeader(row) {
  selectedKelompok.value = row
  formGantiLeader.value = { newLeaderId: '' }
  // Load detail untuk dapat daftar anggota
  const res = await adminKelompokApi.getDetail(row.id)
  anggotaKelompok.value = res.data.data?.anggotaList || []
  showGantiLeader.value = true
}

async function openTambahAnggota(row) {
  selectedKelompok.value = row
  formTambahAnggota.value = { userIds: [] }
  await loadMemberBebas()
  showTambahAnggota.value = true
}

async function submitBuatKelompok() {
  if (!formBuat.value.namaKelompok || !formBuat.value.leaderId) {
    toast.error('Nama kelompok dan leader wajib diisi')
    return
  }
  submitLoading.value = true
  try {
    await adminKelompokApi.buatKelompok(formBuat.value)
    toast.success('Kelompok berhasil dibuat!')
    showBuatKelompok.value = false
    load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal membuat kelompok')
  } finally { submitLoading.value = false }
}

async function submitGantiLeader() {
  if (!formGantiLeader.value.newLeaderId) {
    toast.error('Pilih leader baru')
    return
  }
  submitLoading.value = true
  try {
    await adminKelompokApi.gantiLeader(selectedKelompok.value.id, formGantiLeader.value)
    toast.success('Leader berhasil diganti!')
    showGantiLeader.value = false
    load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal ganti leader')
  } finally { submitLoading.value = false }
}

async function submitTambahAnggota() {
  if (formTambahAnggota.value.userIds.length === 0) return
  submitLoading.value = true
  try {
    await adminKelompokApi.tambahAnggota(selectedKelompok.value.id, { userIds: formTambahAnggota.value.userIds })
    toast.success('Anggota berhasil ditambahkan!')
    showTambahAnggota.value = false
    load()
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal tambah anggota')
  } finally { submitLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
.loading-center { display:flex; justify-content:center; padding:2.5rem; }
.action-row { display:flex; gap:4px; flex-wrap:wrap; }
.mono-text { font-family:var(--font-mono); font-size:0.8rem; }
.anggota-chips { display:flex; flex-wrap:wrap; gap:8px; }
.anggota-chip { display:inline-flex; align-items:center; gap:6px; background:var(--clr-surface-2); border:1px solid var(--clr-border); padding:4px 12px; border-radius:var(--radius-full); font-size:0.8125rem; }
.leader-tag { font-size:0.65rem; background:var(--clr-accent-light); color:var(--clr-warning); padding:1px 6px; border-radius:var(--radius-full); font-weight:600; }
.detail-pinjaman-grid { background:var(--clr-surface-2); border-radius:var(--radius-md); padding:12px; display:flex; flex-direction:column; gap:8px; }
.dp-row { display:flex; justify-content:space-between; font-size:0.875rem; }
.dp-row span:first-child { color:var(--clr-text-3); }
.confirm-detail { background:var(--clr-surface-2); border-radius:var(--radius-md); padding:12px 16px; display:flex; flex-direction:column; gap:8px; }
.confirm-row { display:flex; justify-content:space-between; font-size:0.875rem; }
.confirm-row span:first-child { color:var(--clr-text-3); }
.btn-success-confirm { background:var(--clr-success); color:#fff; border:none; display:inline-flex; align-items:center; gap:6px; }
.btn-success-confirm:hover { opacity:0.88; }
.btn-warning { background:var(--clr-accent-light); color:#92400e; border:1px solid rgba(180,120,0,0.3); }
.btn-warning:hover { background:var(--clr-warning); color:#fff; }
.row-terlambat td { background:rgba(220,38,38,0.04); }
.required-mark { color:var(--clr-danger); }
.btn-icon-close { background:none; border:none; cursor:pointer; color:var(--clr-text-3); padding:4px; border-radius:var(--radius-sm); }
.btn-icon-close:hover { background:var(--clr-surface-2); color:var(--clr-text); }
</style>