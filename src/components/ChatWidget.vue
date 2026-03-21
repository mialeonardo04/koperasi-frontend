<template>
  <div class="chat-widget">
    <!-- Bubble toggle button -->
    <button class="chat-toggle" @click="toggleChat" :class="{ open: isOpen }">
      <MessageCircle v-if="!isOpen" :size="24" />
      <X v-else :size="24" />
      <span v-if="unread > 0 && !isOpen" class="unread-dot">{{ unread }}</span>
    </button>

    <!-- Chat window -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-window">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">🤝</div>
            <div>
              <div class="chat-title">Asisten Koperasi</div>
              <div class="chat-subtitle">Tanya apa saja seputar koperasi</div>
            </div>
          </div>
          <button class="btn-reset" @click="resetChat" title="Reset percakapan">
            <RotateCcw :size="14" />
          </button>
        </div>

        <!-- Messages -->
        <div class="chat-messages" ref="messagesEl">
          <!-- Welcome message -->
          <div class="msg msg-bot" v-if="messages.length === 0">
            <div class="msg-bubble">
              Halo! Saya asisten virtual Koperasi Leyangan 👋<br><br>
              Saya bisa membantu kamu cek saldo simpanan, info pinjaman kelompok, jadwal angsuran, dan layanan koperasi lainnya.<br><br>
              Ada yang bisa saya bantu?
            </div>
          </div>

          <div v-for="(msg, i) in messages" :key="i"
               class="msg" :class="msg.role === 'user' ? 'msg-user' : 'msg-bot'">
            <div class="msg-bubble" v-html="formatMsg(msg.content)" />
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="msg msg-bot">
            <div class="msg-bubble msg-loading">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input-wrap">
          <input
            v-model="inputText"
            type="text"
            class="chat-input"
            placeholder="Ketik pertanyaan..."
            @keydown.enter="sendMessage"
            :disabled="loading"
            ref="inputEl"
          />
          <button class="chat-send" @click="sendMessage" :disabled="loading || !inputText.trim()">
            <Send :size="16" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { MessageCircle, X, Send, RotateCcw } from 'lucide-vue-next'
import api from '@/services/api'

const isOpen    = ref(false)
const loading   = ref(false)
const inputText = ref('')
const messages  = ref([])
const unread    = ref(0)
const messagesEl = ref(null)
const inputEl    = ref(null)

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unread.value = 0
    nextTick(() => {
      inputEl.value?.focus()
      scrollToBottom()
    })
  }
}

async function sendMessage() {
  const pesan = inputText.value.trim()
  if (!pesan || loading.value) return

  messages.value.push({ role: 'user', content: pesan })
  inputText.value = ''
  loading.value   = true
  await scrollToBottom()

  try {
    const res = await api.post('/chat/message', { pesan })
    const balasan = res.data.data.balasan
    messages.value.push({ role: 'assistant', content: balasan })
    if (!isOpen.value) unread.value++
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

async function resetChat() {
  try {
    await api.delete('/chat/reset')
    messages.value = []
  } catch {}
}

function formatMsg(text) {
  // Konversi newline dan basic formatting
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  font-family: var(--font-sans, sans-serif);
}

/* Toggle button */
.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--clr-primary, #2d6a4f);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}
.chat-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
.chat-toggle.open { background: #555; }

.unread-dot {
  position: absolute;
  top: -4px; right: -4px;
  width: 20px; height: 20px;
  background: #ef4444;
  color: #fff;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* Chat window */
.chat-window {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 340px;
  height: 480px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* Header */
.chat-header {
  background: var(--clr-primary, #2d6a4f);
  color: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.chat-header-info { display: flex; align-items: center; gap: 10px; }
.chat-avatar { font-size: 1.5rem; }
.chat-title { font-weight: 700; font-size: 0.9rem; }
.chat-subtitle { font-size: 0.72rem; opacity: 0.8; }
.btn-reset {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 6px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}
.btn-reset:hover { background: rgba(255,255,255,0.35); }

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9fafb;
}

.msg { display: flex; }
.msg-user { justify-content: flex-end; }
.msg-bot  { justify-content: flex-start; }

.msg-bubble {
  max-width: 80%;
  padding: 9px 13px;
  border-radius: 14px;
  font-size: 0.82rem;
  line-height: 1.55;
  word-break: break-word;
}
.msg-user .msg-bubble {
  background: var(--clr-primary, #2d6a4f);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-bot .msg-bubble {
  background: #fff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

/* Loading dots */
.msg-loading {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
}
.msg-loading span {
  width: 7px; height: 7px;
  background: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.msg-loading span:nth-child(2) { animation-delay: 0.2s; }
.msg-loading span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40%           { transform: scale(1.1); opacity: 1; }
}

/* Input */
.chat-input-wrap {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.82rem;
  outline: none;
  transition: border 0.15s;
  font-family: inherit;
}
.chat-input:focus { border-color: var(--clr-primary, #2d6a4f); }
.chat-input:disabled { background: #f3f4f6; }

.chat-send {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--clr-primary, #2d6a4f);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
.chat-send:not(:disabled):hover { opacity: 0.85; }

/* Animation */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>