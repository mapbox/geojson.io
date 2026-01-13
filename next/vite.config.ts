import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  plugins:
    env.mode === 'test'
      ? [react(), tsconfigPaths()]
      : [react(), tsconfigPaths(), nodePolyfills()],
  worker: {
    format: 'es',
    plugins: () => [tsconfigPaths()]
  },
  test: {
    dir: './',
    deps: {
      interopDefault: true
    },
    globals: true,
    setupFiles: './test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
}));
