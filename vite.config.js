import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path tương thích với GitHub Pages (VD: https://<username>.github.io/roommate/)
  // Khi deploy lên GitHub Pages, Vite sẽ tự động thêm base path này vào tài nguyên tĩnh.
  base: process.env.NODE_ENV === 'production' ? '/roommate/' : '/',

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          chartjs: ['chart.js'],
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});