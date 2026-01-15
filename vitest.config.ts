import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts', 'src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      lines: 15,
      functions: 10,
      branches: 10,
      statements: 15,
    },
  },
});
