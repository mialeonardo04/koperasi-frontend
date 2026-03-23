import axios from 'axios'
import { toast } from 'vue3-toastify'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// ── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(config => {
  // Attach JWT token
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Guard 1: Blokir request jika URL mengandung "undefined" atau "null"
  // Ini terjadi saat template literal menerima undefined: `/pinjaman/${undefined}`
  const url = config.url || ''
  if (url.includes('/undefined') || url.includes('/null')) {
    console.warn('[API Guard] Blocked request with invalid URL:', url)
    return Promise.reject(new Error(`Request dibatalkan: URL tidak valid (${url})`))
  }

  // Guard 2: Bersihkan query params yang undefined/null/''
  // Ini mencegah ?userId=undefined terkirim ke backend
  if (config.params) {
    const cleaned = {}
    for (const [key, val] of Object.entries(config.params)) {
      if (val !== undefined && val !== null && val !== '') {
        cleaned[key] = val
      }
    }
    config.params = cleaned
  }

  return config
})

// ── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    // Jika error dari guard di atas (bukan dari server), diam saja
    if (!err.response) return Promise.reject(err)

    const msg = err.response?.data?.message || 'Terjadi kesalahan jaringan'
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (err.response?.status === 403) {
      toast.error('Anda tidak memiliki akses ke fitur ini')
    } else if (err.response?.status !== 400) {
      // Jangan tampilkan toast untuk endpoint yang 400 = kondisi normal
      const url = err.config?.url || ''
      const silentUrls = ['/kelompok/saya']
      if (!silentUrls.some(u => url.includes(u))) {
        toast.error(msg)
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  profile:        ()     => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ── Simpanan ─────────────────────────────────────────────────
export const simpananApi = {
  saldo:   ()       => api.get('/simpanan/saldo'),
  riwayat: (params) => api.get('/simpanan/riwayat', { params }),
}

// ── Pinjaman ─────────────────────────────────────────────────
export const pinjamanApi = {
  ajukan:  (data)   => api.post('/pinjaman/ajukan', data),
  riwayat: (params) => api.get('/pinjaman/riwayat', { params }),
  detail:  (id)     => api.get(`/pinjaman/${id}`),
  jadwal:  (id)     => api.get(`/pinjaman/${id}/jadwal-angsuran`),
}

// ── Upload bukti pembayaran ───────────────────────────────────
export const uploadApi = {
  buktiBayar: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/upload/bukti-bayar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  viewUrl: (path) => path ? `/api/upload/bukti-bayar/view?path=${encodeURIComponent(path)}` : null,
}

// ── Pengajuan transaksi (flow approval) ──────────────────────
export const pengajuanApi = {
  ajukanSetor:         (data)   => api.post('/pengajuan/setor', data),
  ajukanTarik:         (data)   => api.post('/pengajuan/tarik', data),
  ajukanBayarAngsuran: (data)   => api.post('/pengajuan/bayar-angsuran', data),
  riwayat:             (params) => api.get('/pengajuan/riwayat', { params }),
}

// ── Report ───────────────────────────────────────────────────
export const kelompokApi = {
  // Member
  buat:           (data)      => api.post('/kelompok', data),
  cariMember:     (params)    => api.get('/kelompok/cari-member', { params }),
  memberBebas:    ()          => api.get('/kelompok/member-bebas'),
  saya:           ()          => api.get('/kelompok/saya'),
  detail:         (id)        => api.get(`/kelompok/${id}`),
  tambahAnggota:  (id, data)  => api.post(`/kelompok/${id}/anggota`, data),
  keluarKelompok:   (id)      => api.delete(`/kelompok/${id}/anggota`),
  bubarkanKelompok:  (id)          => api.delete(`/kelompok/${id}`),
  // Pencairan
  requestPencairan:  (pinjamanId, data) => api.post(`/kelompok/pinjaman/${pinjamanId}/cairkan`, data),
  prosesPencairan:   (pencairanId, data) => api.put(`/kelompok/pencairan/${pencairanId}/proses`, data),
  pencairanPending:  (kelompokId)       => api.get(`/kelompok/${kelompokId}/pencairan/pending`),
  riwayatPencairan:  (pinjamanId)       => api.get(`/kelompok/pinjaman/${pinjamanId}/pencairan`),
  pinjamanDetail:    (pinjamanId)       => api.get(`/kelompok/pinjaman/${pinjamanId}`),
  ajukanPinjaman: (id, data)  => api.post(`/kelompok/${id}/pinjaman`, data),
  bayarAngsuran:  (data)      => api.post('/kelompok/bayar-angsuran', data),
  teguran:        (id)        => api.get(`/kelompok/${id}/teguran`),
}

export const reportApi = {
  dashboard: () => api.get('/report/dashboard'),
}

// ── Admin ────────────────────────────────────────────────────
export const adminKelompokApi = {
  getAllKelompok:   (params) => api.get('/admin/kelompok', { params }),
  getDetail:        (id)     => api.get(`/admin/kelompok/${id}`),
  buatKelompok:     (data)   => api.post('/admin/kelompok', data),
  tambahAnggota:    (id, data) => api.post(`/admin/kelompok/${id}/anggota`, data),
  gantiLeader:      (id, data) => api.put(`/admin/kelompok/${id}/leader`, data),
  bubarkanKelompok: (id)     => api.delete(`/admin/kelompok/${id}`),
}

export const adminApi = {
  // Member
  members:       (params)     => api.get('/admin/members', { params }),
  memberDetail:  (id)         => api.get(`/admin/members/${id}`),
  updateStatus:  (id, status) => api.put(`/admin/members/${id}/status`, null, { params: { status } }),
  updateProfile: (id, params) => api.put(`/admin/members/${id}/profile`, null, { params }),
  createUser:    (data)       => api.post('/admin/members/create', data),
  updateRole:    (id, role)   => api.put(`/admin/members/${id}/role`, { role }),
  updateTelegramChatId: (id, chatId) => api.put(`/admin/members/${id}/telegram`, null, { params: { chatId } }),

  // Simpanan
  allSimpanan:   (params)        => api.get('/admin/simpanan', { params }),
  saldoMember:   (userId)        => api.get(`/admin/simpanan/saldo/${userId}`),
  setorMember:   (userId, data)  => api.post(`/admin/simpanan/setor/${userId}`, data),
  tarikMember:   (userId, data)  => api.post(`/admin/simpanan/tarik/${userId}`, data),

  // Pinjaman
  pinjamanPendingCount: () => api.get('/admin/pinjaman/pending-count'),
  allPinjaman:          (params) => api.get('/admin/pinjaman', { params }),
  prosesPinjaman:     (id, data) => api.put(`/admin/pinjaman/${id}/proses`, data),
  jadwalAngsuranAdmin:    (id)   => api.get(`/admin/pinjaman/${id}/jadwal-angsuran`),

  // Approval
  pendingSummary:   ()           => api.get('/admin/pengajuan/summary'),
  allPending:       ()           => api.get('/admin/pengajuan/pending'),
  allPengajuan:     (params)     => api.get('/admin/pengajuan', { params }),
  prosesPengajuan:  (id, data)   => api.put(`/admin/pengajuan/${id}/proses`, data),

  // Kelompok
  allKelompok:            (params)              => api.get('/admin/kelompok', { params }),
  kelompokDetail:         (id)                  => api.get(`/admin/kelompok/${id}`),
  prosesPinjamanKelompok: (id, disetujui, ket)  => api.put(`/admin/kelompok/pinjaman/${id}/proses`, null, { params: { disetujui, keteranganAdmin: ket } }),
  kirimTeguran:           (id, data)            => api.post(`/admin/kelompok/${id}/teguran`, data),

  // Report
  dashboard:     ()              => api.get('/admin/report/dashboard'),
  rekapSimpanan: ()              => api.get('/admin/report/rekap-simpanan'),
  rekapPinjaman: ()              => api.get('/admin/report/rekap-pinjaman'),
}

export const slipApi = {
  slipSetoran:    (transaksiId) => api.get(`/slip/setoran/${transaksiId}`,    { responseType: 'blob' }),
  slipAngsuran:   (angsuranId)  => api.get(`/slip/angsuran/${angsuranId}`,    { responseType: 'blob' }),
  kartuSimpanan:  ()            => api.get('/slip/kartu-simpanan',             { responseType: 'blob' }),
}

export default api