<template>
  <div class="profil-page">
    <div class="grid-2" style="align-items:start">
      <!-- Info Card -->
      <div class="card">
        <div class="profil-avatar-section">
          <div class="profil-avatar">{{ initials }}</div>
          <div>
            <h3>{{ user?.namaLengkap }}</h3>
            <p class="text-muted text-sm" style="font-family:var(--font-mono)">{{ user?.nomorAnggota }}</p>
            <span class="badge badge-success" style="margin-top:6px">{{ user?.status }}</span>
          </div>
        </div>
        <hr class="divider" />
        <div class="info-list">
          <div class="info-row"><span class="info-label">Email</span><span>{{ user?.email }}</span></div>
          <div class="info-row"><span class="info-label">Role</span><span>{{ user?.role }}</span></div>
          <div class="info-row"><span class="info-label">Total Simpanan</span><span class="money font-semibold">{{ formatRupiah(user?.totalSimpanan) }}</span></div>
        </div>
      </div>

      <!-- Ganti Password -->
      <div class="card">
        <h4 style="margin-bottom:1.25rem">Ganti Password</h4>
        <form @submit.prevent="submitPassword" class="pass-form">
          <div class="form-group">
            <label class="form-label">Password Lama</label>
            <input v-model="passForm.passwordLama" type="password" class="form-input" placeholder="••••••" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password Baru</label>
            <input v-model="passForm.passwordBaru" type="password" class="form-input" placeholder="Minimal 6 karakter" minlength="6" required />
          </div>
          <div class="form-group">
            <label class="form-label">Konfirmasi Password Baru</label>
            <input v-model="passForm.konfirmasi" type="password" class="form-input" placeholder="Ulangi password baru" required />
          </div>
          <p class="form-error" v-if="passError">{{ passError }}</p>
          <button type="submit" class="btn btn-primary" :disabled="submittingPass">
            <span class="spinner" v-if="submittingPass" />
            <span v-else>Simpan Password</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Kartu Simpanan -->
    <div class="card" style="margin-top:1.25rem">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h4 style="margin:0 0 4px 0">Kartu Simpanan</h4>
          <p class="text-sm text-muted">Download rekap saldo simpanan kamu dalam format PDF</p>
        </div>
        <button class="btn btn-primary btn-sm" @click="downloadKartuSimpanan" :disabled="downloadingKartu">
          <span v-if="downloadingKartu" class="spinner" style="width:12px;height:12px;border-width:2px"/>
          <span v-else>📄 Download PDF</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { slipApi, authApi } from '@/services/api'
import { downloadPdf, formatRupiah } from '@/services/helpers'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'

const auth = useAuthStore()
const user = computed(() => auth.user)

const downloadingKartu = ref(false)

async function downloadKartuSimpanan() {
  downloadingKartu.value = true
  try {
    const res = await slipApi.kartuSimpanan()
    downloadPdf(res.data, 'kartu-simpanan.pdf')
  } catch(e) {
    toast.error('Gagal download kartu simpanan')
  } finally {
    downloadingKartu.value = false
  }
}

const initials = computed(() => {
  return (user.value?.namaLengkap || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})

const passForm = ref({ passwordLama: '', passwordBaru: '', konfirmasi: '' })
const passError     = ref('')
const submittingPass = ref(false)

async function submitPassword() {
  passError.value = ''
  if (passForm.value.passwordBaru !== passForm.value.konfirmasi) {
    passError.value = 'Konfirmasi password tidak cocok'
    return
  }
  submittingPass.value = true
  try {
    await authApi.changePassword({ passwordLama: passForm.value.passwordLama, passwordBaru: passForm.value.passwordBaru })
    toast.success('Password berhasil diubah!')
    passForm.value = { passwordLama: '', passwordBaru: '', konfirmasi: '' }
  } catch (e) {
    passError.value = e.response?.data?.message || 'Gagal mengubah password'
  } finally {
    submittingPass.value = false
  }
}
</script>

<style scoped>
.profil-avatar-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.profil-avatar {
  width: 56px; height: 56px; border-radius: var(--radius-full);
  background: var(--clr-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.125rem; font-weight: 700; flex-shrink: 0;
}
.info-list { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
.info-label { color: var(--clr-text-3); }
.pass-form { display: flex; flex-direction: column; gap: 1rem; }
</style>