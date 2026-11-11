import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
      '/backend': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
      '/api_proxy': {
        target: 'https://willian.uazapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_proxy/, ''),
      },
      '/free_api_proxy': {
        target: 'https://free.uazapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/free_api_proxy/, ''),
      }
    }
  }
})
