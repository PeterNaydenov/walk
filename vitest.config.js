import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['node_modules', 'test', 'test-data'],
      reporter: ['lcov', 'text-summary']
    }
  }
})
