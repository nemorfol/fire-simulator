import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Aggiungi questa riga

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: { // Aggiungi questa sezione
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/istat': {
        target: 'http://sdmx.istat.it/SDMXWS/rest/data/22_289',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/istat/, ''),
      },
    },
  },
})
