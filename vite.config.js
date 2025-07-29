import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
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
