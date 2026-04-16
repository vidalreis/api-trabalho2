import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false, // SQLite não suporta acesso paralelo
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/routes/**', 'src/middleware/**'],
    },
  },
  resolve: {
    alias: {
      '.js': '',
    },
  },
});
