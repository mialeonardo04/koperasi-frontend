<template>
  <div class="admin-laporan">

    <!-- Tab switcher -->
    <div class="laporan-tabs">
      <button class="tab" :class="{ active: tab==='simpanan' }" @click="tab='simpanan'">
        <Wallet :size="15" /> Rekap Simpanan
      </button>
      <button class="tab" :class="{ active: tab==='pinjaman' }" @click="tab='pinjaman'">
        <Banknote :size="15" /> Rekap Pinjaman
      </button>
    </div>

    <!-- ===== FILTER BAR ===== -->
    <div class="filter-bar card card-sm">
      <div class="filter-row">
        <!-- Filter Member -->
        <div class="filter-group">
          <label class="filter-label">Filter Anggota</label>
          <select v-model="filterMemberId" class="form-input form-select filter-select" @change="applyFilter">
            <option value="">Semua Anggota</option>
            <option v-for="m in memberList" :key="m.id" :value="m.id">
              {{ m.nomorAnggota }} — {{ m.namaLengkap }}
            </option>
          </select>
        </div>

        <!-- Filter Bulan (hanya simpanan) -->
        <template v-if="tab==='simpanan'">
          <div class="filter-group">
            <label class="filter-label">Bulan</label>
            <select v-model="filterBulan" class="form-input form-select filter-select" @change="applyFilter">
              <option value="">Semua Bulan</option>
              <option v-for="b in bulanOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Tahun</label>
            <select v-model="filterTahun" class="form-input form-select filter-select" @change="applyFilter">
              <option value="">Semua Tahun</option>
              <option v-for="t in tahunOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </template>

        <!-- Filter Status (hanya pinjaman) -->
        <template v-if="tab==='pinjaman'">
          <div class="filter-group">
            <label class="filter-label">Status Pinjaman</label>
            <select v-model="filterStatus" class="form-input form-select filter-select" @change="applyFilter">
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="LUNAS">Lunas</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="MACET">Macet</option>
            </select>
          </div>
        </template>

        <!-- Tombol Reset + Export -->
        <div class="filter-actions">
          <button class="btn btn-ghost btn-sm" @click="resetFilter">
            <RotateCcw :size="14" /> Reset
          </button>
          <button class="btn btn-export btn-sm" @click="exportExcel" :disabled="exporting">
            <span class="spinner" v-if="exporting" style="width:14px;height:14px;border-width:2px" />
            <FileSpreadsheet v-else :size="14" />
            Export Excel
          </button>
        </div>
      </div>

      <!-- Filter info badge -->
      <div class="filter-info" v-if="isFiltered">
        <span class="filter-badge" v-if="filterMemberId">
          Anggota: {{ selectedMemberName }}
          <button @click="filterMemberId=''; applyFilter()">×</button>
        </span>
        <span class="filter-badge" v-if="filterBulan">
          Bulan: {{ bulanOptions.find(b=>b.value===filterBulan)?.label }}
          <button @click="filterBulan=''; applyFilter()">×</button>
        </span>
        <span class="filter-badge" v-if="filterTahun">
          Tahun: {{ filterTahun }}
          <button @click="filterTahun=''; applyFilter()">×</button>
        </span>
        <span class="filter-badge" v-if="filterStatus">
          Status: {{ filterStatus }}
          <button @click="filterStatus=''; applyFilter()">×</button>
        </span>
        <span class="text-xs text-muted">{{ filteredCount }} data ditampilkan</span>
      </div>
    </div>

    <!-- ===== REKAP SIMPANAN ===== -->
    <div v-if="tab==='simpanan'">
      <div class="laporan-header">
        <div>
          <h4>Rekap Simpanan</h4>
          <p class="text-sm text-muted">{{ filteredSimpanan.length }} anggota</p>
        </div>
        <div class="laporan-total-row">
          <div class="laporan-total-item">
            <span class="text-xs text-muted">Total Pokok</span>
            <span class="money font-semibold">{{ formatRupiah(totalPokok) }}</span>
          </div>
          <div class="laporan-total-item">
            <span class="text-xs text-muted">Total Wajib</span>
            <span class="money font-semibold">{{ formatRupiah(totalWajib) }}</span>
          </div>
          <div class="laporan-total-item">
            <span class="text-xs text-muted">Total Sukarela</span>
            <span class="money font-semibold">{{ formatRupiah(totalSukarela) }}</span>
          </div>
          <div class="laporan-total-item highlight">
            <span class="text-xs">Grand Total</span>
            <span class="money font-semibold">{{ formatRupiah(grandTotalSimpanan) }}</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div v-if="loadingSimpanan" class="loading-center"><div class="spinner"/></div>
        <div v-else-if="filteredSimpanan.length===0" class="empty-state"><p>Belum ada data</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>No. Anggota</th>
                <th>Nama</th>
                <th>Pokok</th>
                <th>Wajib</th>
                <th>Sukarela</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in filteredSimpanan" :key="r.nomorAnggota">
                <td class="text-muted text-sm">{{ i+1 }}</td>
                <td><span class="mono-text">{{ r.nomorAnggota }}</span></td>
                <td class="font-medium">{{ r.namaAnggota }}</td>
                <td class="money">{{ formatRupiah(r.simpananPokok) }}</td>
                <td class="money">{{ formatRupiah(r.simpananWajib) }}</td>
                <td class="money">{{ formatRupiah(r.simpananSukarela) }}</td>
                <td class="money font-semibold">{{ formatRupiah(r.total) }}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="font-semibold">TOTAL</td>
                <td class="money font-semibold">{{ formatRupiah(totalPokok) }}</td>
                <td class="money font-semibold">{{ formatRupiah(totalWajib) }}</td>
                <td class="money font-semibold">{{ formatRupiah(totalSukarela) }}</td>
                <td class="money font-semibold" style="color:var(--clr-primary)">{{ formatRupiah(grandTotalSimpanan) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== REKAP PINJAMAN ===== -->
    <div v-if="tab==='pinjaman'">
      <div class="laporan-header">
        <div>
          <h4>Rekap Pinjaman</h4>
          <p class="text-sm text-muted">{{ filteredPinjaman.length }} pinjaman</p>
        </div>
        <div class="laporan-total-row">
          <div class="laporan-total-item">
            <span class="text-xs text-muted">Total Dipinjam</span>
            <span class="money font-semibold">{{ formatRupiah(totalDipinjam) }}</span>
          </div>
          <div class="laporan-total-item">
            <span class="text-xs text-muted">Total Terbayar</span>
            <span class="money font-semibold" style="color:var(--clr-success)">{{ formatRupiah(totalTerbayar) }}</span>
          </div>
          <div class="laporan-total-item highlight">
            <span class="text-xs">Total Sisa</span>
            <span class="money font-semibold" style="color:var(--clr-danger)">{{ formatRupiah(totalSisaPinjaman) }}</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div v-if="loadingPinjaman" class="loading-center"><div class="spinner"/></div>
        <div v-else-if="filteredPinjaman.length===0" class="empty-state"><p>Belum ada data</p></div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>No. Anggota</th>
                <th>Nama</th>
                <th>No. Pinjaman</th>
                <th>Jumlah</th>
                <th>Sudah Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in filteredPinjaman" :key="r.noPinjaman">
                <td class="text-muted text-sm">{{ i+1 }}</td>
                <td><span class="mono-text">{{ r.nomorAnggota }}</span></td>
                <td class="font-medium">{{ r.namaAnggota }}</td>
                <td><span class="mono-text">{{ r.noPinjaman }}</span></td>
                <td class="money">{{ formatRupiah(r.jumlahPinjaman) }}</td>
                <td class="money money-positive">{{ formatRupiah(r.sudahDibayar) }}</td>
                <td class="money money-negative">{{ formatRupiah(r.sisaPinjaman) }}</td>
                <td><span class="badge" :class="statusBadge(r.status).class">{{ statusBadge(r.status).label }}</span></td>
              </tr>
              <tr class="total-row">
                <td colspan="4" class="font-semibold">TOTAL</td>
                <td class="money font-semibold">{{ formatRupiah(totalDipinjam) }}</td>
                <td class="money font-semibold" style="color:var(--clr-success)">{{ formatRupiah(totalTerbayar) }}</td>
                <td class="money font-semibold" style="color:var(--clr-danger)">{{ formatRupiah(totalSisaPinjaman) }}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Wallet, Banknote, FileSpreadsheet, RotateCcw } from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import { adminApi } from '@/services/api'
import { formatRupiah, statusBadge , parsePage } from '@/services/helpers'
import { toast } from 'vue3-toastify'

// ─── State ───────────────────────────────────────────────
const tab             = ref('simpanan')
const rekapSimpanan   = ref([])
const rekapPinjaman   = ref([])
const memberList      = ref([])
const loadingSimpanan = ref(false)
const loadingPinjaman = ref(false)
const exporting       = ref(false)

// Filter state
const filterMemberId = ref('')
const filterBulan    = ref('')
const filterTahun    = ref(new Date().getFullYear().toString())
const filterStatus   = ref('')

// ─── Options ─────────────────────────────────────────────
const bulanOptions = [
  { value: '1',  label: 'Januari'   }, { value: '2',  label: 'Februari' },
  { value: '3',  label: 'Maret'     }, { value: '4',  label: 'April'    },
  { value: '5',  label: 'Mei'       }, { value: '6',  label: 'Juni'     },
  { value: '7',  label: 'Juli'      }, { value: '8',  label: 'Agustus'  },
  { value: '9',  label: 'September' }, { value: '10', label: 'Oktober'  },
  { value: '11', label: 'November'  }, { value: '12', label: 'Desember' },
]

const tahunOptions = computed(() => {
  const now = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => (now - i).toString())
})

const selectedMemberName = computed(() => {
  const m = memberList.value.find(m => m.id == filterMemberId.value)
  return m ? m.namaLengkap : ''
})

// ─── Filtered Data ────────────────────────────────────────
const filteredSimpanan = computed(() => {
  let data = rekapSimpanan.value
  if (filterMemberId.value) {
    const m = memberList.value.find(m => m.id == filterMemberId.value)
    if (m) data = data.filter(r => r.nomorAnggota === m.nomorAnggota)
  }
  return data
})

const filteredPinjaman = computed(() => {
  let data = rekapPinjaman.value
  if (filterMemberId.value) {
    const m = memberList.value.find(m => m.id == filterMemberId.value)
    if (m) data = data.filter(r => r.nomorAnggota === m.nomorAnggota)
  }
  if (filterStatus.value) {
    data = data.filter(r => r.status === filterStatus.value)
  }
  return data
})

const isFiltered = computed(() =>
  !!filterMemberId.value || !!filterBulan.value || !!filterTahun.value || !!filterStatus.value
)

const filteredCount = computed(() =>
  tab.value === 'simpanan' ? filteredSimpanan.value.length : filteredPinjaman.value.length
)

// ─── Totals ───────────────────────────────────────────────
const totalPokok         = computed(() => filteredSimpanan.value.reduce((s,r) => s + (r.simpananPokok||0), 0))
const totalWajib         = computed(() => filteredSimpanan.value.reduce((s,r) => s + (r.simpananWajib||0), 0))
const totalSukarela      = computed(() => filteredSimpanan.value.reduce((s,r) => s + (r.simpananSukarela||0), 0))
const grandTotalSimpanan = computed(() => totalPokok.value + totalWajib.value + totalSukarela.value)

const totalDipinjam     = computed(() => filteredPinjaman.value.reduce((s,r) => s + (r.jumlahPinjaman||0), 0))
const totalTerbayar     = computed(() => filteredPinjaman.value.reduce((s,r) => s + (r.sudahDibayar||0), 0))
const totalSisaPinjaman = computed(() => filteredPinjaman.value.reduce((s,r) => s + (r.sisaPinjaman||0), 0))

// ─── Helpers ──────────────────────────────────────────────
function applyFilter() { /* filter reaktif via computed */ }

function resetFilter() {
  filterMemberId.value = ''
  filterBulan.value    = ''
  filterTahun.value    = new Date().getFullYear().toString()
  filterStatus.value   = ''
}

function buildFilterLabel() {
  const parts = []
  if (filterMemberId.value) parts.push(selectedMemberName.value)
  if (filterBulan.value)    parts.push(bulanOptions.find(b => b.value === filterBulan.value)?.label)
  if (filterTahun.value)    parts.push(filterTahun.value)
  if (filterStatus.value)   parts.push(filterStatus.value)
  return parts.length ? parts.join(' - ') : 'Semua'
}

function rupiahNum(val) {
  return typeof val === 'number' ? val : 0
}

// ─── Export Excel ─────────────────────────────────────────
function exportExcel() {
  exporting.value = true
  try {
    const wb    = XLSX.utils.book_new()
    const label = buildFilterLabel()
    const now   = new Date()
    const tgl   = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`

    if (tab.value === 'simpanan') {
      // ── Sheet 1: Rekap Simpanan ──
      const titleInfo = [
        ['KOPERASI LEYANGAN'],
        ['REKAP SIMPANAN'],
        [`Filter: ${label}`],
        [`Dicetak: ${tgl}`],
        [],
      ]

      const header = [['No', 'No. Anggota', 'Nama Anggota', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela', 'Total']]

      const rows = filteredSimpanan.value.map((r, i) => [
        i + 1,
        r.nomorAnggota,
        r.namaAnggota,
        rupiahNum(r.simpananPokok),
        rupiahNum(r.simpananWajib),
        rupiahNum(r.simpananSukarela),
        rupiahNum(r.total),
      ])

      const totalRow = [
        '', '', 'TOTAL',
        rupiahNum(totalPokok.value),
        rupiahNum(totalWajib.value),
        rupiahNum(totalSukarela.value),
        rupiahNum(grandTotalSimpanan.value),
      ]

      const allRows = [...titleInfo, ...header, ...rows, [], totalRow]
      const ws = XLSX.utils.aoa_to_sheet(allRows)

      // Lebar kolom
      ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 28 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      ]

      // Format angka sebagai currency Indonesia
      const currencyCols = [3, 4, 5, 6] // D, E, F, G (0-indexed)
      const dataStartRow = titleInfo.length + header.length + 1 // 1-indexed untuk XLSX
      const dataEndRow   = dataStartRow + rows.length

      for (let row = dataStartRow; row <= dataEndRow + 1; row++) {
        currencyCols.forEach(col => {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
            ws[cellRef].t = 'n'
            ws[cellRef].z = '#,##0'
          }
        })
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Simpanan')

      // Nama file
      const fileName = `Rekap_Simpanan_${label.replace(/\s/g,'_')}_${tgl}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success(`File ${fileName} berhasil diunduh!`)

    } else {
      // ── Sheet 1: Rekap Pinjaman ──
      const titleInfo = [
        ['KOPERASI LEYANGAN'],
        ['REKAP PINJAMAN'],
        [`Filter: ${label}`],
        [`Dicetak: ${tgl}`],
        [],
      ]

      const header = [['No', 'No. Anggota', 'Nama Anggota', 'No. Pinjaman', 'Jumlah Pinjaman', 'Sudah Dibayar', 'Sisa Pinjaman', 'Status']]

      const rows = filteredPinjaman.value.map((r, i) => [
        i + 1,
        r.nomorAnggota,
        r.namaAnggota,
        r.noPinjaman,
        rupiahNum(r.jumlahPinjaman),
        rupiahNum(r.sudahDibayar),
        rupiahNum(r.sisaPinjaman),
        statusBadge(r.status).label,
      ])

      const totalRow = [
        '', '', '', 'TOTAL',
        rupiahNum(totalDipinjam.value),
        rupiahNum(totalTerbayar.value),
        rupiahNum(totalSisaPinjaman.value),
        '',
      ]

      const allRows = [...titleInfo, ...header, ...rows, [], totalRow]
      const ws = XLSX.utils.aoa_to_sheet(allRows)

      ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 22 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
      ]

      const currencyCols = [4, 5, 6]
      const dataStartRow = titleInfo.length + header.length + 1
      const dataEndRow   = dataStartRow + rows.length

      for (let row = dataStartRow; row <= dataEndRow + 1; row++) {
        currencyCols.forEach(col => {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
            ws[cellRef].t = 'n'
            ws[cellRef].z = '#,##0'
          }
        })
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Pinjaman')

      const fileName = `Rekap_Pinjaman_${label.replace(/\s/g,'_')}_${tgl}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success(`File ${fileName} berhasil diunduh!`)
    }
  } catch (err) {
    console.error(err)
    toast.error('Gagal mengekspor Excel')
  } finally {
    exporting.value = false
  }
}

// ─── Load Data ────────────────────────────────────────────
async function loadMembers() {
  try {
    const res = await adminApi.members({ page: 0, size: 200 })
    memberList.value = (res.data.data?.content ?? res.data.data?.page?.content ?? [])
  } catch {}
}

async function loadRekapSimpanan() {
  loadingSimpanan.value = true
  try {
    const res = await adminApi.rekapSimpanan()
    rekapSimpanan.value = res.data.data
  } finally {
    loadingSimpanan.value = false
  }
}

async function loadRekapPinjaman() {
  loadingPinjaman.value = true
  try {
    const res = await adminApi.rekapPinjaman()
    rekapPinjaman.value = res.data.data
  } finally {
    loadingPinjaman.value = false
  }
}

watch(tab, t => {
  if (t === 'simpanan' && rekapSimpanan.value.length === 0) loadRekapSimpanan()
  if (t === 'pinjaman' && rekapPinjaman.value.length === 0) loadRekapPinjaman()
  // Reset filter saat ganti tab
  filterStatus.value = ''
  filterBulan.value  = ''
})

onMounted(() => {
  loadMembers()
  loadRekapSimpanan()
})
</script>

<style scoped>
.laporan-tabs {
  display:flex; gap:6px; margin-bottom:1.25rem;
  background:var(--clr-surface); border:1px solid var(--clr-border);
  border-radius:var(--radius-lg); padding:4px; width:fit-content;
}
.tab {
  display:flex; align-items:center; gap:7px; padding:9px 16px;
  border-radius:var(--radius-md); font-size:0.875rem; font-weight:500;
  border:none; background:transparent; cursor:pointer;
  font-family:var(--font-sans); color:var(--clr-text-2); transition:all var(--transition);
}
.tab.active { background:var(--clr-primary); color:#fff; }

/* Filter Bar */
.filter-bar { margin-bottom:1.25rem; }
.filter-row { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
.filter-group { display:flex; flex-direction:column; gap:5px; }
.filter-label { font-size:0.75rem; font-weight:500; color:var(--clr-text-3); }
.filter-select { min-width:180px; max-width:220px; }
.filter-actions { display:flex; gap:8px; align-items:center; margin-left:auto; }
.filter-info { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px solid var(--clr-border); }
.filter-badge {
  display:inline-flex; align-items:center; gap:5px;
  background:var(--clr-primary-light); color:var(--clr-primary);
  border-radius:var(--radius-full); padding:3px 10px;
  font-size:0.75rem; font-weight:500;
}
.filter-badge button {
  background:none; border:none; cursor:pointer;
  color:var(--clr-primary); font-size:1rem; line-height:1; padding:0;
}
.filter-badge button:hover { color:var(--clr-danger); }

/* Export button */
.btn-export {
  background:var(--clr-success); color:#fff; border:none;
  display:inline-flex; align-items:center; gap:6px;
}
.btn-export:hover { opacity:0.88; transform:translateY(-1px); box-shadow:var(--shadow-sm); }
.btn-export:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

/* Laporan layout */
.laporan-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:12px; }
.laporan-total-row { display:flex; gap:10px; flex-wrap:wrap; }
.laporan-total-item {
  display:flex; flex-direction:column; gap:3px;
  background:var(--clr-surface); border:1px solid var(--clr-border);
  padding:10px 14px; border-radius:var(--radius-md);
}
.laporan-total-item.highlight { background:var(--clr-primary-light); border-color:rgba(27,77,62,0.2); }
.loading-center { display:flex; justify-content:center; padding:2.5rem; }
.mono-text { font-family:var(--font-mono); font-size:0.8rem; }
.total-row td { background:var(--clr-surface-2) !important; border-top:2px solid var(--clr-border-strong) !important; }
</style>