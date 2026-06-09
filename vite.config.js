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
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
