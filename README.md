# Koperasi Leyangan — Frontend

Aplikasi web Sistem Simpan Pinjam Digital Koperasi Leyangan, dibangun dengan Vue 3 + Vite.

---

## Prasyarat

Pastikan sudah terinstall:

- **Node.js** v18 atau lebih baru → [nodejs.org](https://nodejs.org)
- **npm** v9 atau lebih baru (sudah termasuk saat install Node.js)

Cek versi:
```bash
node -v
npm -v
```

---

## Instalasi

### 1. Clone / Download project

```bash
# Masuk ke folder frontend
cd koperasi-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Tidak ada file `.env` yang diperlukan untuk konfigurasi dasar. Semua request API di-proxy melalui Vite ke backend.

Pastikan backend sudah berjalan di `http://localhost:8080` sebelum menjalankan frontend.

---

## Menjalankan Aplikasi

### Development (dengan hot-reload)

```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Lokal:** `http://localhost:3000`
- **Jaringan:** `http://<IP_KOMPUTER>:3000`

### Build untuk Production

```bash
npm run build
```

File hasil build akan ada di folder `dist/`.

### Preview Build

```bash
npm run preview
```

---

## Konfigurasi Jaringan

Jika ingin diakses dari perangkat lain di jaringan yang sama (misal HP atau komputer lain), pastikan:

**1. Buka port di Windows Firewall** (jalankan sebagai Administrator):
```powershell
netsh advfirewall firewall add rule name="Vite Dev" dir=in action=allow protocol=TCP localport=3000
```

**2. Cek IP komputer:**
```powershell
ipconfig
```
Cari baris `IPv4 Address` di bagian `Wireless LAN adapter Wi-Fi`.

**3. Akses dari perangkat lain:**
```
http://<IP_KOMPUTER>:3000
```

---

## Struktur Folder

```
koperasi-frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.vue       # Layout utama (sidebar + topbar)
│   │   │   └── SidebarLink.vue     # Komponen link sidebar
│   │   ├── BuktiBayarUploader.vue  # Upload foto bukti pembayaran
│   │   └── CurrencyInput.vue       # Input nominal dengan format titik
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── DashboardView.vue
│   │   ├── SimpananView.vue
│   │   ├── PinjamanView.vue
│   │   ├── PinjamanDetailView.vue
│   │   ├── ProfilView.vue
│   │   └── admin/
│   │       ├── AdminDashboardView.vue
│   │       ├── AdminMembersView.vue
│   │       ├── AdminSimpananView.vue
│   │       ├── AdminPinjamanView.vue
│   │       ├── AdminApprovalView.vue
│   │       └── AdminLaporanView.vue
│   ├── services/
│   │   ├── api.js        # Axios instance + semua endpoint API
│   │   └── helpers.js    # Fungsi format (formatRupiah, formatDate, parsePage, dll)
│   ├── stores/
│   │   ├── auth.js       # Pinia store: autentikasi & user
│   │   └── approval.js   # Pinia store: badge counter pengajuan
│   └── router/
│       └── index.js      # Definisi route Vue Router
├── public/
├── vite.config.js         # Konfigurasi Vite + proxy API
├── package.json
└── index.html
```

---

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@koperasi.id | admin123 |
| Member | member@koperasi.id | member123 |

---

## Teknologi

| Package | Versi | Kegunaan |
|---------|-------|----------|
| Vue | ^3.4.0 | Framework utama |
| Vue Router | ^4.3.0 | Routing halaman |
| Pinia | ^2.1.7 | State management |
| Axios | ^1.6.0 | HTTP client |
| Vite | ^5.0.0 | Build tool & dev server |
| dayjs | ^1.11.10 | Format tanggal |
| xlsx | ^0.18.5 | Export Excel |
| lucide-vue-next | ^0.358.0 | Icon |
| vue3-toastify | ^0.2.1 | Notifikasi toast |
| chart.js | ^4.4.0 | Grafik dashboard |

---

## Catatan

- Proxy `/api` → `http://localhost:8080` sudah dikonfigurasi di `vite.config.js`
- Jika IP jaringan berubah, tidak perlu mengubah konfigurasi apapun — proxy tetap menggunakan `localhost`
- File upload bukti bayar disimpan di backend, bukan di frontend