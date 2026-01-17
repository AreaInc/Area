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
  resolve: {
    alias: {
      '@area/shared': path.resolve(__dirname, '../packages/shared'),
    },
  },
  optimizeDeps: {
    include: ['@area/shared'],
  },
})

