import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react' // Optional: if you need to test React components directly

export default defineConfig({
  // plugins: [react()], // Uncomment if testing React components that use JSX
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for browser-like environment
    setupFiles: [], // For any test setup files if needed later
    include: ['lib/**/*.test.ts'], // Pattern to find test files
    coverage: { // Optional: configure coverage reporting
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
    },
  },
})
