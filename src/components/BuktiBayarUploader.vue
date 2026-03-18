<template>
  <div class="uploader">
    <!-- Preview jika sudah ada file -->
    <div class="preview-wrap" v-if="previewUrl">
      <img :src="previewUrl" class="preview-img" alt="Bukti" />
      <button type="button" class="remove-btn" @click="clearFile" title="Hapus">×</button>
    </div>

    <!-- Area upload -->
    <div v-else class="upload-area" :class="{ dragover }"
         @click="triggerInput"
         @dragover.prevent="dragover = true"
         @dragleave="dragover = false"
         @drop.prevent="onDrop">
      <div class="upload-content">
        <ImageIcon :size="28" style="opacity:0.35" />
        <p class="upload-hint">Klik atau seret foto ke sini</p>
        <p class="upload-sub">JPG, PNG, WebP · Maks 1MB</p>
        <div class="upload-actions">
          <button type="button" class="btn btn-ghost btn-sm" @click.stop="triggerInput">
            <Upload :size="13" /> Pilih File
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click.stop="openCamera">
            <Camera :size="13" /> Kamera
          </button>
        </div>
      </div>
    </div>

    <!-- Input file tersembunyi -->
    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp"
           style="display:none" @change="onFileChange" />

    <!-- Status upload -->
    <div class="upload-status" v-if="uploading">
      <div class="spinner" style="width:14px;height:14px;border-width:2px" />
      <span class="text-xs text-muted">Mengunggah...</span>
    </div>
    <div class="upload-status success" v-else-if="modelValue">
      <CheckCircle :size="14" />
      <span class="text-xs">Bukti berhasil diunggah</span>
    </div>

    <!-- Modal Kamera -->
    <Teleport to="body">
      <div class="camera-overlay" v-if="showCamera">
        <div class="camera-box">
          <div class="camera-header">
            <span>Ambil Foto Bukti</span>
            <button type="button" @click="closeCamera">×</button>
          </div>
          <video ref="videoEl" class="camera-video" autoplay playsinline />
          <canvas ref="canvasEl" style="display:none" />
          <div class="camera-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="closeCamera">Batal</button>
            <button type="button" class="btn btn-primary" @click="capturePhoto">
              <Camera :size="16" /> Ambil Foto
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { Upload, Camera, ImageIcon, CheckCircle } from 'lucide-vue-next'
import { uploadApi } from '@/services/api'
import { toast } from 'vue3-toastify'

const props  = defineProps({ modelValue: String }) // path dari server
const emit   = defineEmits(['update:modelValue'])

const fileInput  = ref(null)
const previewUrl = ref(null)
const uploading  = ref(false)
const dragover   = ref(false)
const showCamera = ref(false)
const videoEl    = ref(null)
const canvasEl   = ref(null)
let   stream     = null

const MAX_SIZE  = 1 * 1024 * 1024  // 1 MB
const MAX_DIM   = 1200              // max width/height setelah resize

// ── Helpers ──────────────────────────────────────────────────

function triggerInput() { fileInput.value?.click() }

function clearFile() {
  previewUrl.value = null
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}

function onDrop(e) {
  dragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

// ── Resize + Upload ───────────────────────────────────────────

async function processFile(file) {
  if (!file.type.startsWith('image/')) {
    toast.error('Hanya file gambar yang didukung')
    return
  }

  // Resize jika perlu (canvas)
  const resized = await resizeImage(file)
  previewUrl.value = URL.createObjectURL(resized)
  await uploadFile(resized)
}

function resizeImage(file) {
  return new Promise((resolve) => {
    // Jika sudah <= 1MB, langsung return
    if (file.size <= MAX_SIZE) { resolve(file); return }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Scale down proportionally
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      // Kompres quality sampai <= 1MB
      let quality = 0.85
      const tryBlob = (q) => {
        canvas.toBlob(blob => {
          if (blob && blob.size <= MAX_SIZE) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else if (q > 0.3) {
            tryBlob(q - 0.1)
          } else {
            // Paksa dengan quality terendah
            canvas.toBlob(b => resolve(new File([b], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.3)
          }
        }, 'image/jpeg', q)
      }
      tryBlob(quality)
    }
    img.src = url
  })
}

async function uploadFile(file) {
  uploading.value = true
  try {
    const res  = await uploadApi.buktiBayar(file)
    const path = res.data.data
    emit('update:modelValue', path)
  } catch (e) {
    toast.error('Gagal mengunggah bukti: ' + (e.response?.data?.message || 'Error'))
    clearFile()
  } finally {
    uploading.value = false
  }
}

// ── Kamera ────────────────────────────────────────────────────

async function openCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    showCamera.value = true
    // Assign stream setelah DOM mount
    setTimeout(() => { if (videoEl.value) videoEl.value.srcObject = stream }, 100)
  } catch (e) {
    toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.')
  }
}

function closeCamera() {
  stopStream()
  showCamera.value = false
}

function stopStream() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

function capturePhoto() {
  if (!videoEl.value) return
  const video  = videoEl.value
  const canvas = canvasEl.value
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)

  canvas.toBlob(async blob => {
    if (!blob) return
    closeCamera()
    const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
    await processFile(file)
  }, 'image/jpeg', 0.9)
}

onUnmounted(() => stopStream())
</script>

<style scoped>
.uploader { width: 100%; }

.upload-area {
  border: 2px dashed var(--clr-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all var(--transition);
  background: var(--clr-surface-2);
  text-align: center;
}
.upload-area:hover,
.upload-area.dragover {
  border-color: var(--clr-primary);
  background: var(--clr-primary-light);
}
.upload-content { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.upload-hint { font-size: 0.875rem; font-weight: 500; color: var(--clr-text-2); }
.upload-sub  { font-size: 0.75rem; color: var(--clr-text-3); }
.upload-actions { display: flex; gap: 8px; margin-top: 4px; }

.preview-wrap {
  position: relative; display: inline-block; width: 100%;
  border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--clr-border);
}
.preview-img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
.remove-btn {
  position: absolute; top: 6px; right: 6px;
  background: rgba(0,0,0,0.55); color: #fff; border: none;
  border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.remove-btn:hover { background: var(--clr-danger); }

.upload-status {
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  padding: 6px 10px; border-radius: var(--radius-md);
  background: var(--clr-surface-2); font-size: 0.8125rem;
}
.upload-status.success { color: var(--clr-success); }

/* Kamera modal */
.camera-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.camera-box {
  background: #111; border-radius: var(--radius-xl);
  width: 100%; max-width: 480px; overflow: hidden;
  display: flex; flex-direction: column;
}
.camera-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: rgba(255,255,255,0.05);
  color: #fff; font-size: 0.875rem; font-weight: 600;
}
.camera-header button {
  background: none; border: none; color: rgba(255,255,255,0.6);
  font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 0 4px;
}
.camera-header button:hover { color: #fff; }
.camera-video { width: 100%; display: block; background: #000; }
.camera-footer {
  display: flex; gap: 10px; justify-content: center;
  padding: 14px 16px; background: rgba(255,255,255,0.05);
}
</style>