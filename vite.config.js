const path = require('path');
const { defineConfig } = require('vite');
const vue = require('@vitejs/plugin-vue');

module.exports = defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
