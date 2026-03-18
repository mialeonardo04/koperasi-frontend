<template>
  <div class="approval-page">

    <!-- Summary stats -->
    <div class="approval-stats">
      <div class="stat-pill pending">
        <Clock :size="14" />
        <span>{{ counts.PENDING || 0 }} Menunggu</span>
      </div>
      <div class="stat-pill success">
        <CheckCircle :size="14" />
        <span>{{ counts.DISETUJUI || 0 }} Disetujui</span>
      </div>
      <div class="stat-pill danger">
        <XCircle :size="14" />
        <span>{{ counts.DITOLAK || 0 }} Ditolak</span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs">
      <button
        v-for="f in filters" :key="f.value"
        class="ftab" :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value; loadData()"
      >{{ f.label }}</button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0">
      <div v-if="loading" class="loading-center"><div class="spinner" /></div>
      <div v-else-if="list.length === 0" class="empty-state">
        <ClipboardCheck :size="40" style="opacity:0.25" />
        <p>Tidak ada pengajuan</p>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Anggota</th>
              <th>Jenis</th>
              <th>Detail</th>
              <th>Jumlah</th>
              <th>Waktu</th>
              <th>Bukti</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>
                <div class="member-cell">
                  <div class="member-avatar">{{ initials(item.namaAnggota) }}</div>
                  <div>
                    <p class="font-medium text-sm">{{ item.namaAnggota }}</p>
                    <p class="text-xs text-muted mono-text">{{ item.nomorAnggota }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="jenis-badge" :class="jenisBadgeClass(item.jenisTransaksi)">
                  {{ jenisLabel(item.jenisTransaksi) }}
                </span>
              </td>
              <td class="text-sm">
                <span v-if="item.jenisSimpanan">{{ item.jenisSimpanan }}</span>
                <span v-else-if="item.noPinjaman" class="mono-text text-xs">
                  {{ item.noPinjaman }} — ke-{{ item.periodeAngsuran }}
                </span>
                <span v-if="item.keterangan" class="text-xs text-muted" style="display:block">{{ item.keterangan }}</span>
              </td>
              <td class="money font-semibold">{{ item.jumlah ? formatRupiah(item.jumlah) : '-' }}</td>
              <td class="text-xs text-muted">{{ formatDateTime(item.createdAt) }}</td>
              <td>
                <a v-if="item.buktiBayar"
                   :href="uploadApi.viewUrl(item.buktiBayar)"
                   target="_blank"
                   class="bukti-link">
                  <ImageIcon :size="13" /> Lihat Bukti
                </a>
                <span v-else class="text-xs text-muted">-</span>
              </td>
              <td>
                <span class="badge" :class="statusBadgeClass(item.status)">{{ statusLabel(item.status) }}</span>
                <p class="text-xs text-muted" v-if="item.catatanAdmin" style="margin-top:3px">{{ item.catatanAdmin }}</p>
              </td>
              <td>
                <div class="action-btns" v-if="item.status === 'PENDING'">
                  <button class="btn btn-success btn-sm" :disabled="processingId === item.id" @click="openApproveModal(item)">
                    <CheckCircle :size="14" />
                    Setujui
                  </button>
                  <button class="btn btn-danger btn-sm" :disabled="processingId === item.id" @click="openRejectModal(item)">
                    <XCircle :size="14" /> Tolak
                  </button>
                </div>
                <span v-else class="text-xs text-muted">
                  {{ item.approvedByName ? 'oleh ' + item.approvedByName : '-' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" style="padding:0.75rem 1rem;justify-content:center" v-if="page.totalPages > 1">
        <button class="page-btn" :disabled="page.number === 0" @click="changePage(page.number - 1)">‹</button>
        <button v-for="p in page.totalPages" :key="p" class="page-btn" :class="{ active: page.number === p - 1 }" @click="changePage(p - 1)">{{ p }}</button>
        <button class="page-btn" :disabled="page.number >= page.totalPages - 1" @click="changePage(page.number + 1)">›</button>
      </div>
    </div>

    <!-- Reject Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="showRejectModal" @click.self="showRejectModal = false">
          <div class="modal-box">
            <div class="modal-icon-wrap modal-icon-danger"><XCircle :size="24" /></div>
            <h4 class="modal-title">Tolak Pengajuan?</h4>
            <p class="text-sm text-muted" style="text-align:center;margin-bottom:1rem">
              {{ rejectTarget ? jenisLabel(rejectTarget.jenisTransaksi) + ' · ' + rejectTarget.namaAnggota : '' }}
              <span v-if="rejectTarget?.jumlah" class="money font-semibold" style="display:block;font-size:1rem;margin-top:4px;color:var(--clr-text)">
                {{ formatRupiah(rejectTarget.jumlah) }}
              </span>
            </p>
            <div class="form-group">
              <label class="form-label">Catatan untuk member <span class="text-muted">(opsional)</span></label>
              <textarea v-model="rejectNote" class="form-input" rows="3" placeholder="Misal: Saldo tidak mencukupi saat verifikasi..." />
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showRejectModal = false">Batal</button>
              <button class="btn btn-danger" :disabled="processingId === rejectTarget?.id" @click="proses(rejectTarget, false)">
                <span class="spinner" v-if="processingId === rejectTarget?.id" style="width:14px;height:14px;border-width:2px" />
                <XCircle v-else :size="14" /> Ya, Tolak
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Approve Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="modal-overlay" v-if="showApproveModal" @click.self="showApproveModal = false">
          <div class="modal-box">
            <div class="modal-icon-wrap modal-icon-success"><CheckCircle :size="24" /></div>
            <h4 class="modal-title">Setujui Pengajuan?</h4>
            <p class="text-sm text-muted" style="text-align:center;margin-bottom:1rem">
              Transaksi berikut akan dieksekusi setelah disetujui:
            </p>
            <div class="confirm-detail" v-if="approveTarget">
              <div class="confirm-row">
                <span>Anggota</span>
                <strong>{{ approveTarget.namaAnggota }}</strong>
              </div>
              <div class="confirm-row">
                <span>No. Anggota</span>
                <span class="mono-text">{{ approveTarget.nomorAnggota }}</span>
              </div>
              <div class="confirm-row">
                <span>Jenis</span>
                <span class="jenis-badge" :class="jenisBadgeClass(approveTarget.jenisTransaksi)">{{ jenisLabel(approveTarget.jenisTransaksi) }}</span>
              </div>
              <div class="confirm-row" v-if="approveTarget.jenisSimpanan">
                <span>Simpanan</span>
                <strong>{{ approveTarget.jenisSimpanan }}</strong>
              </div>
              <div class="confirm-row" v-if="approveTarget.noPinjaman">
                <span>No. Pinjaman</span>
                <span class="mono-text">{{ approveTarget.noPinjaman }} ke-{{ approveTarget.periodeAngsuran }}</span>
              </div>
              <div class="confirm-row" v-if="approveTarget.jumlah">
                <span>Jumlah</span>
                <strong class="money" style="font-size:1.125rem;color:var(--clr-success)">{{ formatRupiah(approveTarget.jumlah) }}</strong>
              </div>
              <div class="confirm-row" v-if="approveTarget.keterangan">
                <span>Keterangan</span>
                <span class="text-sm">{{ approveTarget.keterangan }}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showApproveModal = false">Batal</button>
              <button class="btn btn-success-confirm" :disabled="processingId === approveTarget?.id" @click="proses(approveTarget, true)">
                <span class="spinner" v-if="processingId === approveTarget?.id" style="width:14px;height:14px;border-width:2px" />
                <CheckCircle v-else :size="14" /> Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Clock, CheckCircle, XCircle, ClipboardCheck, ImageIcon } from 'lucide-vue-next'
import { adminApi, uploadApi } from '@/services/api'
import { useApprovalStore } from '@/stores/approval'
import { formatRupiah, formatDateTime , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

const approvalStore = useApprovalStore()
const list       = ref([])
const loading    = ref(false)
const processingId = ref(null)
const lastAction   = ref('')
const activeFilter = ref('')
const showRejectModal = ref(false)
const rejectTarget    = ref(null)
const rejectNote      = ref('')
const showApproveModal = ref(false)
const approveTarget    = ref(null)
const page = ref({ number: 0, totalPages: 1 })

const filters = [
  { value: '',          label: 'Semua' },
  { value: 'PENDING',   label: '⏳ Menunggu' },
  { value: 'DISETUJUI', label: '✅ Disetujui' },
  { value: 'DITOLAK',   label: '❌ Ditolak' },
]

const counts = computed(() => {
  const c = { PENDING: 0, DISETUJUI: 0, DITOLAK: 0 }
  list.value.forEach(i => c[i.status] !== undefined && c[i.status]++)
  return c
})

function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function jenisLabel(jenis) {
  const map = { SETOR_SIMPANAN: 'Setor', TARIK_SIMPANAN: 'Tarik', BAYAR_ANGSURAN: 'Bayar Angsuran' }
  return map[jenis] || jenis
}

function jenisBadgeClass(jenis) {
  return {
    SETOR_SIMPANAN: 'jenis-setor',
    TARIK_SIMPANAN: 'jenis-tarik',
    BAYAR_ANGSURAN: 'jenis-angsuran',
  }[jenis] || ''
}

function statusLabel(s) {
  return { PENDING: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak' }[s] || s
}

function statusBadgeClass(s) {
  return { PENDING: 'badge-warning', DISETUJUI: 'badge-success', DITOLAK: 'badge-danger' }[s] || 'badge-neutral'
}

async function loadData(p = 0) {
  loading.value = true
  try {
    const res  = await adminApi.allPengajuan({ status: activeFilter.value, page: p, size: 20 })
    const data = parsePage(res.data.data)
    list.value = data.content
    page.value = { number: data.number, totalPages: data.totalPages }
  } finally {
    loading.value = false
  }
}

function changePage(p) { loadData(p) }

function openRejectModal(item) {
  rejectTarget.value = item
  rejectNote.value   = ''
  showRejectModal.value = true
}

function openApproveModal(item) {
  approveTarget.value   = item
  showApproveModal.value = true
}

async function proses(item, disetujui) {
  processingId.value = item.id
  lastAction.value   = disetujui ? 'approve' : 'reject'
  try {
    await adminApi.prosesPengajuan(item.id, { disetujui, catatanAdmin: rejectNote.value || null })
    toast.success(disetujui ? `Pengajuan ${item.namaAnggota} disetujui!` : `Pengajuan ${item.namaAnggota} ditolak.`)
    showRejectModal.value  = false
    showApproveModal.value = false
    rejectNote.value       = ''
    // Update badge counter langsung tanpa nunggu polling
    approvalStore.decrement()
    await loadData(page.value.number)
    // Sinkronisasi ulang dengan nilai aktual dari server
    await approvalStore.refresh()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal memproses pengajuan')
  } finally {
    processingId.value = null
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.approval-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:1.25rem; }
.stat-pill { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; border-radius:var(--radius-full); font-size:0.8125rem; font-weight:600; }
.stat-pill.pending { background:var(--clr-accent-light); color:#b7791f; }
.stat-pill.success { background:var(--clr-success-bg);   color:var(--clr-success); }
.stat-pill.danger  { background:var(--clr-danger-bg);    color:var(--clr-danger); }

.filter-tabs { display:flex; gap:6px; margin-bottom:1.25rem; flex-wrap:wrap; }
.ftab {
  padding:7px 16px; border-radius:var(--radius-md); font-size:0.875rem; font-weight:500;
  border:1px solid var(--clr-border); background:var(--clr-surface);
  cursor:pointer; font-family:var(--font-sans); color:var(--clr-text-2); transition:all var(--transition);
}
.ftab.active { background:var(--clr-primary); color:#fff; border-color:var(--clr-primary); }

.member-cell { display:flex; align-items:center; gap:10px; }
.member-avatar {
  width:32px; height:32px; border-radius:var(--radius-full);
  background:var(--clr-primary); color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-size:0.7rem; font-weight:700; flex-shrink:0;
}
.jenis-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:var(--radius-full); font-size:0.75rem; font-weight:600; }
.jenis-setor    { background:var(--clr-success-bg); color:var(--clr-success); }
.jenis-tarik    { background:var(--clr-danger-bg);  color:var(--clr-danger); }
.jenis-angsuran { background:var(--clr-info-bg);    color:var(--clr-info); }
.mono-text { font-family:var(--font-mono); }
.action-btns { display:flex; gap:6px; flex-wrap:wrap; }
.btn-success { background:var(--clr-success); color:#fff; border:none; display:inline-flex; align-items:center; gap:5px; }
.btn-success:hover { opacity:0.88; }
.loading-center { display:flex; justify-content:center; padding:2.5rem; }

/* Modal */
.modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(26,23,20,0.55); display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(6px); }
.modal-box { background:var(--clr-surface); border-radius:var(--radius-xl); padding:1.75rem; width:100%; max-width:420px; box-shadow:var(--shadow-lg); }
.modal-actions { display:flex; gap:10px; margin-top:1.25rem; justify-content:flex-end; }
.modal-fade-enter-active { transition:all 0.2s ease; }
.modal-fade-leave-active { transition:all 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity:0; }
.modal-fade-enter-from .modal-box { transform:scale(0.95) translateY(8px); }
.bukti-link {
  display:inline-flex; align-items:center; gap:4px;
  color:var(--clr-primary); font-size:0.8125rem; font-weight:500;
  text-decoration:none; padding:3px 8px;
  border:1px solid var(--clr-primary); border-radius:var(--radius-md);
  transition:all var(--transition); white-space:nowrap;
}
.bukti-link:hover { background:var(--clr-primary); color:#fff; }
</style>

<style>
/* Confirm modal additional styles */
.modal-icon-wrap { width:52px; height:52px; border-radius:var(--radius-full); display:flex; align-items:center; justify-content:center; margin:0 auto 0.75rem; }
.modal-icon-success { background:var(--clr-success-bg); color:var(--clr-success); }
.modal-icon-danger  { background:var(--clr-danger-bg);  color:var(--clr-danger); }
.modal-title { text-align:center; font-size:1.125rem; font-weight:700; margin-bottom:0.25rem; }
.confirm-detail { background:var(--clr-surface-2); border:1px solid var(--clr-border); border-radius:var(--radius-lg); padding:12px 16px; display:flex; flex-direction:column; gap:8px; margin-bottom:1rem; }
.confirm-row { display:flex; justify-content:space-between; align-items:center; font-size:0.875rem; }
.confirm-row span:first-child { color:var(--clr-text-3); }
.confirm-row-amount { border-top:1px solid var(--clr-border); padding-top:8px; margin-top:4px; }
.btn-success-confirm { background:var(--clr-success); color:#fff; border:none; display:inline-flex; align-items:center; gap:6px; }
.btn-success-confirm:hover { opacity:0.88; }
.btn-success-confirm:disabled { opacity:0.6; cursor:not-allowed; }
</style>