import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: https://shubhamsinghjs.github.io/quickbook/admin/
  base: '/quickbook/admin/',
  build: {
    outDir: 'dist'
  }
});
