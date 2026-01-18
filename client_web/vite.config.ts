import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    tailwindcss(),
  ],
  server: {
    host: true, 
    port: 8081,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      clientPort: 8081, 
      host: 'localhost'
    },
  },
  resolve: {
    alias: {
      '@area/shared': path.resolve(__dirname, '../packages/shared'),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['@area/shared'],
  },
})

