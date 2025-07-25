import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para dashboard - direcionar para o backend
      '/dashboard': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy para todas as APIs
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
