import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['node_modules', 'test', 'test-data'],
      reporter: ['lcov', 'text-summary'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
})
