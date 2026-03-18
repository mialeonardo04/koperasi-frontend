import dayjs from 'dayjs'
import 'dayjs/locale/id'
dayjs.locale('id')

export function formatRupiah(val) {
  if (val === null || val === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

export function formatDate(val, fmt = 'DD MMM YYYY') {
  if (!val) return '-'
  return dayjs(val).format(fmt)
}

export function formatDateTime(val) {
  if (!val) return '-'
  return dayjs(val).format('DD MMM YYYY, HH:mm')
}

export function statusBadge(status) {
  const map = {
    AKTIF:      { class: 'badge-success', label: 'Aktif' },
    NON_AKTIF:  { class: 'badge-neutral', label: 'Non Aktif' },
    SUSPEND:    { class: 'badge-danger',  label: 'Suspend' },
    PENDING:    { class: 'badge-warning', label: 'Menunggu' },
    DISETUJUI:  { class: 'badge-success', label: 'Disetujui' },
    DITOLAK:    { class: 'badge-danger',  label: 'Ditolak' },
    LUNAS:      { class: 'badge-primary', label: 'Lunas' },
    MACET:      { class: 'badge-danger',  label: 'Macet' },
    BELUM_BAYAR:{ class: 'badge-warning', label: 'Belum Bayar' },
    SUDAH_BAYAR:{ class: 'badge-success', label: 'Sudah Bayar' },
    TERLAMBAT:  { class: 'badge-danger',  label: 'Terlambat' },
  }
  return map[status] || { class: 'badge-neutral', label: status }
}

export function jenisBadge(jenis) {
  const map = {
    POKOK:    { class: 'badge-primary', label: 'Pokok' },
    WAJIB:    { class: 'badge-info',    label: 'Wajib' },
    SUKARELA: { class: 'badge-neutral', label: 'Sukarela' },
    SETOR:    { class: 'badge-success', label: 'Setor' },
    TARIK:    { class: 'badge-danger',  label: 'Tarik' },
  }
  return map[jenis] || { class: 'badge-neutral', label: jenis }
}

/**
 * Parse PageImpl response dari Spring Boot.
 * Support dua format:
 * - Format lama (tanpa @EnableSpringDataWebSupport):
 *   { content, totalElements, totalPages, number, size }
 * - Format baru (VIA_DTO):
 *   { content, page: { totalElements, totalPages, number, size } }
 */
export function parsePage(data) {
  if (!data) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }
  const pg = data.page ?? data  // VIA_DTO vs lama
  return {
    content:       data.content       ?? [],
    totalElements: pg.totalElements   ?? 0,
    totalPages:    pg.totalPages      ?? 0,
    number:        pg.number          ?? 0,
    size:          pg.size            ?? 10,
  }
}