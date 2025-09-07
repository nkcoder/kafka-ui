/**
 * VITEST CONFIGURATION FOR NEXT.JS + REACT
 * 
 * VITEST ADVANTAGES:
 * - Native ESM support (faster than Jest)
 * - Built-in TypeScript support
 * - Vite-powered for lightning-fast execution
 * - Compatible with React Testing Library
 * - Hot module replacement for tests
 * 
 * TESTING ENVIRONMENT:
 * - jsdom for DOM API simulation
 * - React 19 support with latest testing tools
 * - Path resolution matching tsconfig.json
 * - Comprehensive coverage reporting
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Skip CSS processing in test environment to avoid PostCSS conflicts
  define: {
    // Mock CSS imports in tests
    'import.meta.env.MODE': '"test"',
  },
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Global test configuration
    globals: true,
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      'coverage/',
      'src/app/globals.css',
      '**/*.config.*',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/app/layout.tsx',
        'src/app/globals.css',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    
    // Test timeout
    testTimeout: 10000,
  },
  
  // Path resolution (matches tsconfig.json) - Using Node.js ESM path resolution
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
});