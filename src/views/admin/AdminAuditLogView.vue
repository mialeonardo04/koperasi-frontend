<template>
  <div class="admin-audit-log">
    <div class="header-action">
      <h2 class="page-title">Log Audit Sistem</h2>
      <button class="btn btn-sm" @click="fetchLogs" :disabled="loading">
        <RotateCcw :size="16" :class="{ 'spin': loading }" />
        Refresh
      </button>
    </div>

    <div class="card" style="padding:0; overflow:hidden">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Aksi</th>
              <th>Entitas</th>
              <th>ID</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && logs.length === 0">
              <td colspan="6" class="text-center py-4">Memuat data...</td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="6" class="text-center py-4">Belum ada log audit.</td>
            </tr>
            <tr v-for="log in logs" :key="log.id">
              <td class="text-nowrap text-sm text-muted">
                {{ formatDate(log.createdAt) }}
              </td>
              <td>
                <div class="user-info">
                  <span class="font-medium text-sm">{{ log.user?.namaLengkap || 'SYSTEM' }}</span>
                  <span class="text-xs text-muted block">{{ log.user?.email || '-' }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getActionClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="text-sm">{{ log.entityName || '-' }}</td>
              <td class="text-sm font-mono">{{ log.entityId || '-' }}</td>
              <td>
                <div class="log-details">
                  <div v-if="log.oldValue" class="text-xs text-muted">
                    <span class="font-bold">Lama:</span> {{ log.oldValue }}
                  </div>
                  <div v-if="log.newValue" class="text-xs">
                    <span class="font-bold">Baru:</span> {{ log.newValue }}
                  </div>
                  <div v-if="!log.oldValue && !log.newValue" class="text-xs text-muted">
                    -
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination simple -->
      <div class="pagination-simple" v-if="totalPages > 1">
        <button class="btn btn-sm" :disabled="page === 0" @click="page--; fetchLogs()">Prev</button>
        <span class="text-sm">Halaman {{ page + 1 }} dari {{ totalPages }}</span>
        <button class="btn btn-sm" :disabled="page >= totalPages - 1" @click="page++; fetchLogs()">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { adminApi } from '@/services/api'
import dayjs from 'dayjs'

const logs = ref([])
const loading = ref(false)
const page = ref(0)
const totalPages = ref(0)

async function fetchLogs() {
  loading.value = true
  try {
    const res = await adminApi.auditLogs({ page: page.value, size: 20 })
    logs.value = res.data.data.content
    totalPages.value = res.data.data.totalPages
  } catch (err) {
    console.error('Gagal fetch audit logs:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  return dayjs(date).format('DD MMM YYYY, HH:mm:ss')
}

function getActionClass(action) {
  if (action.includes('LOGIN')) return 'badge-info'
  if (action.includes('CREATE')) return 'badge-success'
  if (action.includes('UPDATE')) return 'badge-warning'
  if (action.includes('DELETE')) return 'badge-danger'
  if (action.includes('APPROVE')) return 'badge-success'
  if (action.includes('REJECT')) return 'badge-danger'
  return 'badge-secondary'
}

onMounted(fetchLogs)
</script>

<style scoped>
.header-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.log-details { max-width: 400px; }
.pagination-simple { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border-top: 1px solid var(--clr-border); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-success { background: #d4edda; color: #155724; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
</style>
