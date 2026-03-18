import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import { toast } from 'vue3-toastify'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn  = computed(() => !!token.value)
  const isAdmin     = computed(() => user.value?.role === 'ADMIN')
  const isMember    = computed(() => user.value?.role === 'MEMBER')

  async function login(email, password) {
    const res = await authApi.login({ email, password })
    const data = res.data.data
    token.value = data.accessToken
    user.value  = data.user
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    toast.success(`Selamat datang, ${data.user.namaLengkap}!`)
    return data
  }

  async function fetchProfile() {
    const res  = await authApi.profile()
    user.value = res.data.data
    localStorage.setItem('user', JSON.stringify(res.data.data))
  }

  function logout() {
    token.value = ''
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, isAdmin, isMember, login, logout, fetchProfile }
})