import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.js'],
    exclude: ['__tests__/**/*Utils.js', 'node_modules/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '__tests__/**'
      ]
    },
    // Add timeout for longer running tests
    testTimeout: 10000,
    // Enable file watching for development
    watch: true
  },
  // Add path mapping similar to Jest
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
}) 