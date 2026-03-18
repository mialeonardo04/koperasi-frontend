<template>
  <div class="admin-dashboard">
    <!-- Stats grid -->
    <div class="grid-4" style="margin-bottom:1.5rem">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <component :is="s.icon" :size="18" :style="{ color: s.color }" />
        </div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value" :class="s.mono ? 'money' : ''">
          <span v-if="loading">—</span>
          <span v-else>{{ s.mono ? formatRupiah(data[s.key]) : data[s.key] }}</span>
        </div>
        <div class="stat-sub" v-if="s.sub && !loading">{{ s.sub(data) }}</div>
      </div>
    </div>

    <!-- Row 2 -->
    <div class="grid-2" style="margin-bottom:1.5rem">
      <!-- Pinjaman status -->
      <div class="card">
        <h4 style="margin-bottom:1.125rem">Status Pinjaman</h4>
        <div class="status-bars">
          <div class="status-bar-item" v-for="s in pinjamanStatus" :key="s.label">
            <div class="sb-top">
              <span class="text-sm">{{ s.label }}</span>
              <span class="font-semibold">{{ loading ? '—' : data[s.key] }}</span>
            </div>
            <div class="sb-track">
              <div class="sb-fill" :style="{ width: loading ? '0%' : sbPct(s.key) + '%', background: s.color }" />
            </div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="card">
        <h4 style="margin-bottom:1.125rem">Aksi Cepat Admin</h4>
        <div class="quick-grid">
          <RouterLink v-for="q in quickLinks" :key="q.to" :to="q.to" class="quick-item">
            <div class="quick-icon" :style="{ background: q.bg }">
              <component :is="q.icon" :size="20" :style="{ color: q.color }" />
            </div>
            <span class="quick-label">{{ q.label }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Alert jatuh tempo -->
    <div class="alert-banner" v-if="!loading && data.angsuranJatuhTempo > 0">
      <AlertTriangle :size="18" />
      <span>Ada <strong>{{ data.angsuranJatuhTempo }} angsuran</strong> yang sudah jatuh tempo dan belum dibayar.</span>
      <RouterLink to="/admin/pinjaman" class="btn btn-sm" style="background:var(--clr-danger);color:#fff;margin-left:auto">
        Lihat Detail
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Users, Wallet, Banknote, TrendingDown, AlertTriangle,
  Clock, CheckCircle, XCircle, UserCheck, FileBarChart
} from 'lucide-vue-next'
import { adminApi } from '@/services/api'
import { formatRupiah } from '@/services/helpers'

const data    = ref({})
const loading = ref(true)

const statCards = [
  { key: 'totalAnggota',      label: 'Total Anggota',       icon: Users,       color: 'var(--clr-primary)',  bg: 'var(--clr-primary-light)',  mono: false, sub: d => `${d.anggotaAktif} aktif` },
  { key: 'totalSimpanan',     label: 'Total Simpanan',      icon: Wallet,      color: 'var(--clr-success)',  bg: 'var(--clr-success-bg)',     mono: true },
  { key: 'totalPinjamanAktif',label: 'Total Pinjaman Aktif',icon: Banknote,    color: 'var(--clr-warning)',  bg: 'var(--clr-warning-bg)',     mono: true },
  { key: 'totalSisaPinjaman', label: 'Sisa Pinjaman',       icon: TrendingDown,color: 'var(--clr-danger)',   bg: 'var(--clr-danger-bg)',      mono: true },
]

const pinjamanStatus = [
  { key: 'pinjamanPending',  label: 'Menunggu Persetujuan', color: '#EF9F27' },
  { key: 'pinjamanAktif',    label: 'Aktif / Berjalan',     color: '#1D9E75' },
  { key: 'angsuranJatuhTempo', label: 'Angsuran Jatuh Tempo', color: '#E24B4A' },
]

const quickLinks = [
  { to: '/admin/members',  label: 'Kelola Anggota',  icon: Users,        color: 'var(--clr-primary)', bg: 'var(--clr-primary-light)' },
  { to: '/admin/pinjaman', label: 'Proses Pinjaman', icon: Banknote,     color: 'var(--clr-warning)', bg: 'var(--clr-warning-bg)' },
  { to: '/admin/simpanan', label: 'Catat Simpanan',  icon: Wallet,       color: 'var(--clr-success)', bg: 'var(--clr-success-bg)' },
  { to: '/admin/laporan',  label: 'Lihat Laporan',   icon: FileBarChart, color: 'var(--clr-info)',    bg: 'var(--clr-info-bg)' },
]

function sbPct(key) {
  const total = (data.value.pinjamanPending || 0) + (data.value.pinjamanAktif || 0) + (data.value.angsuranJatuhTempo || 0)
  if (!total) return 0
  return Math.round(((data.value[key] || 0) / total) * 100)
}

onMounted(async () => {
  try {
    const res  = await adminApi.dashboard()
    data.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.status-bars { display: flex; flex-direction: column; gap: 1rem; }
.sb-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.sb-track { height: 8px; background: var(--clr-surface-2); border-radius: 99px; overflow: hidden; }
.sb-fill  { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-item {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  border-radius: var(--radius-lg); text-decoration: none;
  border: 1px solid var(--clr-border); transition: all var(--transition);
}
.quick-item:hover { border-color: var(--clr-border-strong); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.quick-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.quick-label { font-size: 0.8125rem; font-weight: 500; color: var(--clr-text); }
.alert-banner {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--clr-danger-bg); border: 1px solid rgba(192,57,43,0.2);
  border-radius: var(--radius-lg); padding: 1rem 1.25rem;
  color: var(--clr-danger); font-size: 0.875rem;
}
</style>