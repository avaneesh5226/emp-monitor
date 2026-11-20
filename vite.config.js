import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 5050, not 5000: macOS Control Center (AirPlay) already binds 5000.
      '/api': 'http://localhost:5050',
      '/uploads': 'http://localhost:5050',
      '/socket.io': { target: 'http://localhost:5050', ws: true },
    },
  },
})
