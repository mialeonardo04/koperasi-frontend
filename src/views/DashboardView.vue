<template>
  <div class="dashboard">
    <div v-if="loading" class="loading-state">
      <div class="spinner" style="width:32px;height:32px;border-width:3px" />
    </div>

    <template v-else-if="data">
      <!-- Greeting -->
      <div class="greeting-banner">
        <div>
          <p class="greeting-sub">Selamat datang kembali 👋</p>
          <h2 class="greeting-name">{{ data.namaLengkap }}</h2>
          <p class="greeting-no">{{ data.nomorAnggota }}</p>
        </div>
        <div class="greeting-badge">
          <ShieldCheck :size="28" />
          <span>Anggota Aktif</span>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid-4" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--clr-primary-light)">
            <Wallet :size="18" style="color:var(--clr-primary)" />
          </div>
          <div class="stat-label">Total Simpanan</div>
          <div class="stat-value money">{{ formatRupiah(data.totalSimpanan) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--clr-accent-light)">
            <Banknote :size="18" style="color:var(--clr-warning)" />
          </div>
          <div class="stat-label">Pinjaman Aktif</div>
          <div class="stat-value">{{ data.pinjamanAktif }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--clr-danger-bg)">
            <TrendingDown :size="18" style="color:var(--clr-danger)" />
          </div>
          <div class="stat-label">Sisa Pinjaman</div>
          <div class="stat-value money">{{ formatRupiah(data.sisaPinjaman) }}</div>
        </div>
        <div class="stat-card" :class="{ 'border-danger': data.angsuranTerlambat > 0 }">
          <div class="stat-icon" style="background:var(--clr-warning-bg)">
            <AlertCircle :size="18" style="color:var(--clr-warning)" />
          </div>
          <div class="stat-label">Angsuran Terlambat</div>
          <div class="stat-value" :style="{ color: data.angsuranTerlambat > 0 ? 'var(--clr-danger)' : 'inherit' }">
            {{ data.angsuranTerlambat }}
          </div>
        </div>
      </div>

      <!-- Simpanan breakdown -->
      <div class="grid-2" style="margin-bottom:1.5rem">
        <div class="card">
          <div class="card-head">
            <h4>Rincian Simpanan</h4>
            <RouterLink to="/simpanan" class="btn btn-ghost btn-sm">Lihat semua →</RouterLink>
          </div>
          <div class="saldo-list">
            <div class="saldo-item" v-for="item in saldoItems" :key="item.label">
              <div class="saldo-dot" :style="{ background: item.color }" />
              <div class="saldo-info">
                <span class="saldo-label">{{ item.label }}</span>
                <span class="saldo-val money">{{ formatRupiah(item.val) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h4>Aksi Cepat</h4>
          </div>
          <div class="quick-actions">
            <RouterLink to="/simpanan" class="action-btn action-setor">
              <ArrowDownCircle :size="20" />
              <span>Setor Simpanan</span>
            </RouterLink>
            <RouterLink to="/simpanan" class="action-btn action-tarik">
              <ArrowUpCircle :size="20" />
              <span>Tarik Simpanan</span>
            </RouterLink>
            <RouterLink to="/pinjaman" class="action-btn action-pinjam">
              <Banknote :size="20" />
              <span>Ajukan Pinjaman</span>
            </RouterLink>
            <RouterLink to="/pinjaman" class="action-btn action-angsuran">
              <CheckCircle :size="20" />
              <span>Bayar Angsuran</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Alert terlambat -->
      <div class="alert-banner" v-if="data.angsuranTerlambat > 0">
        <AlertCircle :size="18" />
        <span>Anda memiliki <strong>{{ data.angsuranTerlambat }} angsuran</strong> yang belum dibayar dan sudah jatuh tempo.</span>
        <RouterLink to="/pinjaman" class="btn btn-sm" style="background:var(--clr-danger);color:#fff;margin-left:auto">Bayar Sekarang</RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Wallet, Banknote, TrendingDown, AlertCircle, ShieldCheck, ArrowDownCircle, ArrowUpCircle, CheckCircle } from 'lucide-vue-next'
import { reportApi } from '@/services/api'
import { formatRupiah } from '@/services/helpers'

const data    = ref(null)
const loading = ref(true)

const saldoItems = computed(() => !data.value ? [] : [
  { label: 'Simpanan Pokok',    val: data.value.simpananPokok,    color: 'var(--clr-primary)' },
  { label: 'Simpanan Wajib',    val: data.value.simpananWajib,    color: 'var(--clr-accent)' },
  { label: 'Simpanan Sukarela', val: data.value.simpananSukarela, color: 'var(--clr-primary-mid)' },
])

onMounted(async () => {
  try {
    const res  = await reportApi.dashboard()
    data.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.loading-state { display: flex; justify-content: center; padding: 4rem; }
.greeting-banner {
  background: var(--clr-primary); border-radius: var(--radius-xl);
  padding: 1.75rem 2rem; margin-bottom: 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
  position: relative; overflow: hidden;
}
.greeting-banner::before {
  content: ''; position: absolute; width: 300px; height: 300px;
  background: rgba(200,169,110,0.08); border-radius: 50%;
  top: -100px; right: -80px;
}
.greeting-sub  { font-size: 0.875rem; color: rgba(255,255,255,0.6); }
.greeting-name { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 2px 0 4px; }
.greeting-no   { font-size: 0.8125rem; color: rgba(255,255,255,0.5); font-family: var(--font-mono); }
.greeting-badge {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: var(--clr-accent); background: rgba(200,169,110,0.15);
  padding: 1rem; border-radius: var(--radius-lg); font-size: 0.75rem; font-weight: 600;
}
.border-danger { border-color: var(--clr-danger) !important; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.125rem; }
.saldo-list { display: flex; flex-direction: column; gap: 12px; }
.saldo-item { display: flex; align-items: center; gap: 12px; }
.saldo-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.saldo-info { display: flex; justify-content: space-between; align-items: center; flex: 1; }
.saldo-label { font-size: 0.875rem; color: var(--clr-text-2); }
.saldo-val   { font-size: 0.9375rem; font-weight: 600; }
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 1rem; border-radius: var(--radius-lg); font-size: 0.8125rem; font-weight: 500;
  text-decoration: none; transition: all var(--transition); text-align: center;
}
.action-setor   { background: var(--clr-primary-light); color: var(--clr-primary); }
.action-tarik   { background: var(--clr-danger-bg);     color: var(--clr-danger); }
.action-pinjam  { background: var(--clr-accent-light);  color: var(--clr-warning); }
.action-angsuran{ background: var(--clr-info-bg);       color: var(--clr-info); }
.action-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.alert-banner {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--clr-danger-bg); border: 1px solid rgba(192,57,43,0.2);
  border-radius: var(--radius-lg); padding: 1rem 1.25rem;
  color: var(--clr-danger); font-size: 0.875rem;
}
</style>