<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <div class="sidebar-brand">
        <img
          src="https://cdn.digitaldesa.com/uploads/profil/33.22.19.2009/common/300_semarangkab.png"
          class="brand-logo"
          alt="Logo Koperasi"
        />
        <Transition name="fade">
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">Koperasi Leyangan</span>
            <span class="brand-sub">Kabupaten Semarang</span>
          </div>
        </Transition>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-if="!sidebarCollapsed">
          {{ auth.isAdmin ? 'Admin' : 'Menu' }}
        </div>

        <template v-if="auth.isAdmin">
          <SidebarLink to="/admin/dashboard" icon="LayoutDashboard" label="Dashboard" :collapsed="sidebarCollapsed" />
          <SidebarLink to="/admin/members"   icon="Users"           label="Anggota"   :collapsed="sidebarCollapsed" />
          <SidebarLink to="/admin/simpanan"  icon="Wallet"          label="Simpanan"  :collapsed="sidebarCollapsed" />
          <SidebarLink to="/admin/pinjaman"  icon="Banknote"        label="Pinjaman"  :collapsed="sidebarCollapsed" :badge="approvalStore.pinjamanPendingCount" />
          <SidebarLink to="/admin/approval" icon="ClipboardCheck" label="Pengajuan" :collapsed="sidebarCollapsed" :badge="approvalStore.pendingCount" />
          <SidebarLink to="/admin/kelompok"  icon="Users"           label="Kelompok"  :collapsed="sidebarCollapsed" />
          <SidebarLink to="/admin/laporan"   icon="FileBarChart"    label="Laporan"   :collapsed="sidebarCollapsed" />
          <SidebarLink to="/admin/audit-logs" icon="Activity"        label="Log Audit" :collapsed="sidebarCollapsed" />
        </template>

        <template v-else>
          <SidebarLink to="/dashboard" icon="LayoutDashboard" label="Dashboard" :collapsed="sidebarCollapsed" />
          <SidebarLink to="/simpanan"  icon="Wallet"          label="Simpanan"  :collapsed="sidebarCollapsed" />
          <SidebarLink to="/kelompok"  icon="Users"           label="Kelompok"  :collapsed="sidebarCollapsed" />
          <SidebarLink to="/pinjaman"  icon="Banknote"        label="Pinjaman"  :collapsed="sidebarCollapsed" />
        </template>
      </nav>

      <div class="sidebar-footer">
        <SidebarLink to="/profil" icon="User" label="Profil Saya" :collapsed="sidebarCollapsed" />
        <button class="sidebar-logout" @click="showLogoutConfirm = true">
          <LogOut :size="17" />
          <Transition name="fade">
            <span v-if="!sidebarCollapsed">Keluar</span>
          </Transition>
        </button>
      </div>
    </aside>

    <!-- Logout Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="logout-overlay" v-if="showLogoutConfirm" @click.self="showLogoutConfirm = false">
          <div class="logout-modal">
            <div class="logout-icon-wrap">
              <LogOut :size="26" />
            </div>
            <h3 class="logout-title">Keluar dari Akun?</h3>
            <p class="logout-desc">Sesi Anda akan diakhiri. Anda perlu login kembali untuk mengakses sistem.</p>
            <div class="logout-user">
              <div class="logout-avatar">{{ avatarInitials }}</div>
              <div>
                <p class="logout-name">{{ authStore.user?.namaLengkap }}</p>
                <p class="logout-role">{{ authStore.isAdmin ? 'Administrator' : 'Member' }}</p>
              </div>
            </div>
            <div class="logout-actions">
              <button class="btn btn-secondary" @click="showLogoutConfirm = false">
                Batal
              </button>
              <button class="btn btn-logout-confirm" @click="doLogout">
                <LogOut :size="15" />
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" v-if="mobileOpen" @click="mobileOpen = false" />

    <!-- Chatbot — hanya untuk member -->
    <ChatWidget v-if="!authStore.isAdmin" />

    <!-- Main content -->
    <div class="main-wrap">
      <!-- Header -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="icon-btn" @click="toggleSidebar">
            <Menu :size="20" />
          </button>
          <div class="page-title">{{ pageTitle }}</div>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">{{ avatarInitials }}</div>
            <div class="user-info" v-if="!isMobile">
              <span class="user-name">{{ auth.user?.namaLengkap }}</span>
              <span class="user-role">{{ auth.isAdmin ? 'Administrator' : 'Member' }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page -->
      <main class="page-content">
        <RouterView v-slot="{ Component }">
          <Transition name="slide-up" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { Menu, LogOut } from 'lucide-vue-next'
import { adminApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useApprovalStore } from '@/stores/approval'
import { useWindowSize } from '@vueuse/core'
import SidebarLink from '@/components/layout/SidebarLink.vue'

const router    = useRouter()
const route     = useRoute()
const authStore    = useAuthStore()
const approvalStore = useApprovalStore()
const { width } = useWindowSize()
const isMobile  = computed(() => width.value < 768)
const sidebarCollapsed   = ref(false)
const mobileOpen         = ref(false)
const showLogoutConfirm  = ref(false)

// alias so template can use auth.isAdmin / auth.user
const auth = authStore

function toggleSidebar() {
  if (isMobile.value) { mobileOpen.value = !mobileOpen.value }
  else { sidebarCollapsed.value = !sidebarCollapsed.value }
}

const pageTitle = computed(() => {
  const map = {
    Dashboard:      'Dashboard',
    AdminDashboard: 'Dashboard Admin',
    Simpanan:       'Simpanan',
    Pinjaman:       'Pinjaman',
    PinjamanDetail: 'Detail Pinjaman',
    Kelompok:       'Kelompok Saya',
    Profil:         'Profil Saya',
    AdminMembers:   'Manajemen Anggota',
    AdminSimpanan:  'Manajemen Simpanan',
    AdminPinjaman:  'Manajemen Pinjaman',
    AdminLaporan:   'Laporan',
    AdminApproval:  'Persetujuan Transaksi',
    AdminKelompok:  'Manajemen Kelompok',
  }
  return map[route.name] || 'Koperasi Leyangan'
})

const avatarInitials = computed(() => {
  const name = authStore.user?.namaLengkap || ''
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})

// Poll badge counter pengajuan pending setiap 30 detik
async function fetchPendingCount() {
  if (!authStore.isAdmin) return
  await approvalStore.refresh()
}

let pollTimer = null
watch(() => authStore.isAdmin, (isAdmin) => {
  if (isAdmin) {
    fetchPendingCount()
    pollTimer = setInterval(fetchPendingCount, 30000)
  } else {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }
}, { immediate: true })

async function doLogout() {
  if (pollTimer) clearInterval(pollTimer)
  showLogoutConfirm.value = false
  authStore.logout()
  await router.push('/login')
}
import ChatWidget from '@/components/ChatWidget.vue'
</script>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-w); background: var(--clr-primary);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
  transition: width var(--transition);
  overflow: hidden;
}
.sidebar.collapsed { width: 68px; }
@media (max-width: 767px) {
  .sidebar { width: var(--sidebar-w); transform: translateX(-100%); transition: transform var(--transition); }
  .sidebar.mobile-open { transform: translateX(0); }
}
.mobile-overlay {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99;
}
@media (max-width: 767px) { .mobile-overlay { display: block; } }

.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 1rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);
  min-height: 68px;
}
.brand-logo {
  width: 42px; height: 42px; object-fit: contain;
  flex-shrink: 0; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
}
.brand-text { display: flex; flex-direction: column; gap: 1px; }
.brand-name { font-size: 0.9375rem; font-weight: 700; color: #fff; white-space: nowrap; line-height: 1.3; }
.brand-sub  { font-size: 0.7rem; color: rgba(255,255,255,0.55); white-space: nowrap; font-weight: 400; }

.sidebar-nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.nav-section-label {
  font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.1em; color: rgba(255,255,255,0.4); padding: 4px 10px 8px;
}
.sidebar-footer { padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 3px; }
.sidebar-logout {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: var(--radius-md);
  color: rgba(255,255,255,0.5); background: transparent; border: none;
  cursor: pointer; font-family: var(--font-sans); font-size: 0.875rem;
  transition: all var(--transition); width: 100%; white-space: nowrap; overflow: hidden;
}
.sidebar-logout:hover { background: rgba(255,255,255,0.08); color: #fff; }

.main-wrap {
  flex: 1; margin-left: var(--sidebar-w);
  transition: margin-left var(--transition);
  display: flex; flex-direction: column; min-height: 100vh;
}
.sidebar.collapsed ~ .main-wrap { margin-left: 68px; }
@media (max-width: 767px) { .main-wrap { margin-left: 0 !important; } }

.topbar {
  height: var(--header-h); background: var(--clr-surface);
  border-bottom: 1px solid var(--clr-border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; position: sticky; top: 0; z-index: 50;
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.icon-btn {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  border: 1px solid var(--clr-border); background: var(--clr-surface);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--clr-text-2); transition: all var(--transition);
}
.icon-btn:hover { background: var(--clr-surface-2); color: var(--clr-text); }
.page-title { font-size: 0.9375rem; font-weight: 600; color: var(--clr-text); }

.topbar-right { display: flex; align-items: center; gap: 12px; }
.user-chip { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px; height: 34px; border-radius: var(--radius-full);
  background: var(--clr-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 0.8125rem; font-weight: 600; line-height: 1.3; }
.user-role { font-size: 0.6875rem; color: var(--clr-text-3); }

.page-content { flex: 1; padding: 2rem 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; }
@media (max-width: 768px) { .page-content { padding: 1.25rem 1rem; } }

/* ---- Logout Confirmation Modal ---- */
.logout-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(26, 23, 20, 0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(6px);
}
.logout-modal {
  background: var(--clr-surface);
  border-radius: var(--radius-xl);
  padding: 2rem;
  width: 100%; max-width: 360px;
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 12px;
}
.logout-icon-wrap {
  width: 56px; height: 56px; border-radius: var(--radius-full);
  background: var(--clr-danger-bg); color: var(--clr-danger);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.logout-title { font-size: 1.125rem; font-weight: 700; color: var(--clr-text); }
.logout-desc  { font-size: 0.875rem; color: var(--clr-text-3); line-height: 1.6; max-width: 280px; }
.logout-user  {
  display: flex; align-items: center; gap: 10px;
  background: var(--clr-surface-2); border: 1px solid var(--clr-border);
  border-radius: var(--radius-lg); padding: 10px 14px;
  width: 100%; text-align: left; margin: 4px 0;
}
.logout-avatar {
  width: 36px; height: 36px; border-radius: var(--radius-full);
  background: var(--clr-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.logout-name { font-size: 0.875rem; font-weight: 600; color: var(--clr-text); }
.logout-role { font-size: 0.75rem; color: var(--clr-text-3); margin-top: 1px; }
.logout-actions { display: flex; gap: 10px; width: 100%; margin-top: 4px; }
.logout-actions .btn { flex: 1; justify-content: center; }
.btn-logout-confirm {
  background: var(--clr-danger); color: #fff; border: none;
  display: inline-flex; align-items: center; gap: 7px;
}
.btn-logout-confirm:hover { background: #a93226; transform: translateY(-1px); box-shadow: var(--shadow-md); }

/* Modal transition */
.modal-fade-enter-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-enter-from  { opacity: 0; }
.modal-fade-leave-to    { opacity: 0; }
.modal-fade-enter-from .logout-modal { transform: scale(0.94) translateY(8px); }
.modal-fade-leave-to   .logout-modal { transform: scale(0.96) translateY(4px); }
</style>