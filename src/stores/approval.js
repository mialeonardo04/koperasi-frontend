import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi } from '@/services/api'

export const useApprovalStore = defineStore('approval', () => {
  const pendingCount         = ref(0)  // transaksi pending (setor/tarik/angsuran)
  const pinjamanPendingCount = ref(0)  // pengajuan pinjaman baru

  async function refresh() {
    try {
      const [transaksi, pinjaman] = await Promise.allSettled([
        adminApi.pendingSummary(),
        adminApi.pinjamanPendingCount(),
      ])
      if (transaksi.status === 'fulfilled')
        pendingCount.value = transaksi.value.data.data?.totalPending ?? 0
      if (pinjaman.status === 'fulfilled')
        pinjamanPendingCount.value = pinjaman.value.data.data ?? 0
    } catch {}
  }

  function decrement() {
    if (pendingCount.value > 0) pendingCount.value--
  }

  function decrementPinjaman() {
    if (pinjamanPendingCount.value > 0) pinjamanPendingCount.value--
  }

  return { pendingCount, pinjamanPendingCount, refresh, decrement, decrementPinjaman }
})