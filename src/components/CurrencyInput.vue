<template>
  <div class="currency-input-wrap">
    <span class="input-prefix">Rp</span>
    <input
      ref="inputEl"
      type="text"
      inputmode="numeric"
      class="form-input has-prefix"
      :class="inputClass"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      @keydown="onKeydown"
      @input="onInput"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
  placeholder: { type: String, default: '0' },
  min: { type: Number, default: 0 },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  inputClass: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const inputEl = ref(null)

// Format angka → "1.000.000"
function format(num) {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString('id-ID')
}

// Hapus semua titik → angka murni
function unformat(str) {
  return str.replace(/\./g, '').replace(/\D/g, '')
}

function onKeydown(e) {
  // Izinkan: angka, Backspace, Delete, Arrow, Tab, Home, End, Ctrl/Cmd combinations
  if (
    /^\d$/.test(e.key) ||
    ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'].includes(e.key) ||
    e.ctrlKey || e.metaKey
  ) return
  e.preventDefault()
}

function onInput(e) {
  const el       = e.target
  const raw      = unformat(el.value)       // angka murni, misal "1000000"
  const num      = raw === '' ? null : parseInt(raw, 10)
  const formatted = raw === '' ? '' : format(num)  // "1.000.000"

  // Simpan posisi cursor sebelum ubah value
  const cursorFromEnd = el.value.length - el.selectionStart

  // Set tampilan
  el.value = formatted

  // Kembalikan posisi cursor (hitung dari kanan agar tidak loncat)
  const newPos = Math.max(0, formatted.length - cursorFromEnd)
  el.setSelectionRange(newPos, newPos)

  emit('update:modelValue', num)
}

// Sync dari luar (misal reset form)
watch(() => props.modelValue, (val) => {
  if (!inputEl.value) return
  const currentRaw = unformat(inputEl.value.value)
  const currentNum = currentRaw === '' ? null : parseInt(currentRaw, 10)
  if (currentNum !== val) {
    inputEl.value.value = val != null ? format(val) : ''
  }
})

onMounted(() => {
  if (inputEl.value && props.modelValue != null) {
    inputEl.value.value = format(props.modelValue)
  }
})
</script>

<style scoped>
.currency-input-wrap { position: relative; }
.input-prefix {
  position: absolute; left: 13px; top: 50%;
  transform: translateY(-50%);
  color: var(--clr-text-3); font-size: 0.875rem;
  font-weight: 500; pointer-events: none; z-index: 1;
}
.form-input.has-prefix { padding-left: 38px; }
</style>