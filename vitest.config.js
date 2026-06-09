const path = require('path');
const { defineConfig } = require('vitest/config');
const vue = require('@vitejs/plugin-vue');

module.exports = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
