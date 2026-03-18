<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-deco">
        <div class="deco-circle c1" />
        <div class="deco-circle c2" />
        <div class="deco-circle c3" />
        <div class="login-brand">
          <div class="login-brand-inner">
            <img
              src="https://cdn.digitaldesa.com/uploads/profil/33.22.19.2009/common/300_semarangkab.png"
              class="login-logo-img"
              alt="Logo Koperasi Leyangan"
            />
            <div class="login-brand-text">
              <h1>Koperasi Leyangan</h1>
              <p>Sistem Simpan Pinjam Digital</p>
            </div>
          </div>
        </div>
        <div class="login-features">
          <div class="feature-item" v-for="f in features" :key="f.title">
            <div class="feature-icon">
              <component :is="f.icon" :size="18" />
            </div>
            <div>
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-form-wrap">
        <div class="form-header">
          <h2>Selamat Datang</h2>
          <p>Masuk ke akun koperasi Anda</p>
        </div>

        <form @submit.prevent="submit" class="login-form">
          <div class="form-group">
            <label class="form-label">Alamat Email</label>
            <div class="input-icon-wrap">
              <Mail :size="16" class="input-icon" />
              <input
                v-model="form.email" type="email" class="form-input has-icon"
                placeholder="email@koperasi.id" required autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-icon-wrap">
              <Lock :size="16" class="input-icon" />
              <input
                v-model="form.password" :type="showPass ? 'text' : 'password'"
                class="form-input has-icon has-icon-right"
                placeholder="Masukkan password" required autocomplete="current-password"
              />
              <button type="button" class="input-icon-right" @click="showPass = !showPass">
                <Eye v-if="!showPass" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
          </div>

          <p class="error-msg" v-if="error">{{ error }}</p>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            <span class="spinner" v-if="loading" />
            <span v-else>Masuk</span>
          </button>
        </form>

        <div class="demo-accounts">
          <p class="demo-title">Akun Demo</p>
          <div class="demo-grid">
            <button class="demo-btn" @click="fillDemo('admin@koperasi.id', 'admin123')">
              <Shield :size="14" /> Admin
            </button>
            <button class="demo-btn" @click="fillDemo('member@koperasi.id', 'member123')">
              <User :size="14" /> Member
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, Shield, User, Wallet, TrendingUp, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const form     = ref({ email: '', password: '' })
const loading  = ref(false)
const error    = ref('')
const showPass = ref(false)

const features = [
  { icon: Wallet,      title: 'Kelola Simpanan', desc: 'Setor & tarik simpanan kapan saja' },
  { icon: TrendingUp,  title: 'Ajukan Pinjaman', desc: 'Proses cepat dengan bunga kompetitif' },
  { icon: ShieldCheck, title: 'Aman & Terpercaya', desc: 'Data terlindungi dengan enkripsi JWT' },
]

function fillDemo(email, pass) {
  form.value.email    = email
  form.value.password = pass
}

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    const data = await auth.login(form.value.email, form.value.password)
    await router.push(data.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Email atau password salah'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { display: flex; min-height: 100vh; }

.login-left {
  flex: 1; background: var(--clr-primary);
  display: flex; align-items: center; justify-content: center; padding: 2rem;
  position: relative; overflow: hidden;
}
@media (max-width: 768px) { .login-left { display: none; } }

.login-deco { position: relative; z-index: 2; max-width: 400px; width: 100%; }
.deco-circle {
  position: absolute; border-radius: 50%; opacity: 0.07;
  background: var(--clr-accent);
}
.c1 { width: 400px; height: 400px; top: -150px; right: -150px; }
.c2 { width: 250px; height: 250px; bottom: -80px; left: -80px; }
.c3 { width: 150px; height: 150px; top: 40%; left: 40%; }

.login-brand { margin-bottom: 3rem; }
.login-brand-inner {
  display: flex; align-items: center; gap: 16px;
}
.login-logo-img {
  width: 64px; height: 64px; object-fit: contain; flex-shrink: 0;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
}
.login-brand-text { display: flex; flex-direction: column; gap: 4px; }
.login-brand h1 { font-size: 1.75rem; color: #fff; font-weight: 700; line-height: 1.2; }
.login-brand p  { color: rgba(255,255,255,0.55); font-size: 0.9375rem; }

.login-features { display: flex; flex-direction: column; gap: 1.25rem; }
.feature-item  { display: flex; align-items: flex-start; gap: 14px; }
.feature-icon  {
  width: 38px; height: 38px; background: rgba(200,169,110,0.15); border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; color: var(--clr-accent); flex-shrink: 0;
}
.feature-title { font-size: 0.9375rem; font-weight: 600; color: #fff; }
.feature-desc  { font-size: 0.8125rem; color: rgba(255,255,255,0.5); margin-top: 2px; }

.login-right {
  width: 460px; display: flex; align-items: center; justify-content: center;
  padding: 2rem; background: var(--clr-bg);
}
@media (max-width: 768px) { .login-right { width: 100%; } }

.login-form-wrap { width: 100%; max-width: 380px; }

.form-header { margin-bottom: 2rem; }
.form-header h2 { font-size: 1.625rem; font-weight: 700; }
.form-header p  { color: var(--clr-text-3); margin-top: 4px; }

.login-form { display: flex; flex-direction: column; gap: 1.125rem; }

.input-icon-wrap { position: relative; }
.input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--clr-text-3); pointer-events: none; }
.input-icon-right { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--clr-text-3); padding: 3px; }
.input-icon-right:hover { color: var(--clr-text); }
.form-input.has-icon { padding-left: 40px; }
.form-input.has-icon-right { padding-right: 38px; }

.error-msg { font-size: 0.875rem; color: var(--clr-danger); background: var(--clr-danger-bg); padding: 10px 14px; border-radius: var(--radius-md); }

.demo-accounts { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--clr-border); }
.demo-title { font-size: 0.8125rem; color: var(--clr-text-3); margin-bottom: 8px; text-align: center; }
.demo-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.demo-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px; border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 500;
  background: var(--clr-surface); border: 1px solid var(--clr-border);
  cursor: pointer; font-family: var(--font-sans); color: var(--clr-text-2);
  transition: all var(--transition);
}
.demo-btn:hover { background: var(--clr-primary-light); border-color: var(--clr-primary); color: var(--clr-primary); }
</style>