import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',  // listen di semua interface agar bisa diakses via IP jaringan
    port: 3000,
    proxy: {
      '/api': {
        // target: 'http://192.168.18.11:8080',  // ← IP komputer 
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})