import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || 9695}`,
        changeOrigin: true,
      },
    },
  },
})
