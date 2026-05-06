import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'QuickBookWidget',
      fileName: () => 'quickbook-widget.iife.js',
      cssFileName: 'quickbook-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
});
