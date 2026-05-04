import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /** Root `/` is correct for Vercel and most static hosts; use a subpath only if you deploy under a folder. */
  base: '/',
})
