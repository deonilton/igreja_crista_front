import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Hostinger (e outros painéis) costumam esperar a pasta `build`; o padrão do Vite é `dist`
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
})
