import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      { path: '',            redirect: '/dashboard' },
      { path: 'dashboard',   name: 'Dashboard',      component: () => import('@/views/DashboardView.vue') },
      { path: 'simpanan',    name: 'Simpanan',        component: () => import('@/views/SimpananView.vue') },
      { path: 'pinjaman',    name: 'Pinjaman',        component: () => import('@/views/PinjamanView.vue') },
      { path: 'pinjaman/:id',name: 'PinjamanDetail',  component: () => import('@/views/PinjamanDetailView.vue') },
      { path: 'kelompok',        name: 'Kelompok',             component: () => import('@/views/KelompokView.vue') },
      { path: 'pinjaman/kelompok',  name: 'PinjamanKelompok',     component: () => import('@/views/PinjamanKelompokDetailView.vue') },
      { path: 'profil',      name: 'Profil',          component: () => import('@/views/ProfilView.vue') },

      // Admin only
      { path: 'admin/dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { admin: true } },
      { path: 'admin/members',   name: 'AdminMembers',   component: () => import('@/views/admin/AdminMembersView.vue'),   meta: { admin: true } },
      { path: 'admin/simpanan',  name: 'AdminSimpanan',  component: () => import('@/views/admin/AdminSimpananView.vue'),  meta: { admin: true } },
      { path: 'admin/pinjaman',  name: 'AdminPinjaman',  component: () => import('@/views/admin/AdminPinjamanView.vue'),  meta: { admin: true } },
      { path: 'admin/approval',  name: 'AdminApproval',  component: () => import('@/views/admin/AdminApprovalView.vue'),  meta: { admin: true } },
      { path: 'admin/laporan',   name: 'AdminLaporan',   component: () => import('@/views/admin/AdminLaporanView.vue'),   meta: { admin: true } },
      { path: 'admin/kelompok',  name: 'AdminKelompok',  component: () => import('@/views/admin/AdminKelompokView.vue'),  meta: { admin: true } },
      { path: 'admin/audit-logs',name: 'AdminAuditLog',  component: () => import('@/views/admin/AdminAuditLogView.vue'), meta: { admin: true } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return next('/login')
  if (to.meta.admin && !auth.isAdmin) return next('/dashboard')
  if (to.path === '/login' && auth.isLoggedIn) {
    return next(auth.isAdmin ? '/admin/dashboard' : '/dashboard')
  }
  next()
})

export default router