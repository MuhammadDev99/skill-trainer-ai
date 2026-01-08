import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      // The plugin should be a simple string in the array
      plugins: ["module:@preact/signals-react-transform"],
    },
  })],
  server: {
    proxy: {
      // This matches any request starting with /nvidia-api
      '/nvidia-api': {
        target: 'https://integrate.api.nvidia.com', // The actual API server
        changeOrigin: true, // Needed to trick the server into accepting the host header
        rewrite: (path) => path.replace(/^\/nvidia-api/, ''), // Remove /nvidia-api from the URL before sending
      },
    },
  },
})
