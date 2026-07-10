import { defineConfig } from 'vite'

const isGhPages = process.env.GH_PAGES === 'true'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: isGhPages ? '/control-gastos/' : '/',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
})
