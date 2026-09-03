import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Deploy lên GitHub Pages dạng project site:
  // https://anhnh1938.github.io/goc-ke-studio/
  // Dev server vì vậy cũng chạy ở http://localhost:5173/goc-ke-studio/
  base: '/goc-ke-studio/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
