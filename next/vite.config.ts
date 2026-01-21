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
  base: '/next/',
  build: {
    outDir: '../dist/next'
  },
  define: {
    // Use same public token as original geojson.io if env var not set
    'import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN': JSON.stringify(
      process.env.VITE_PUBLIC_MAPBOX_TOKEN ||
        'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY21rbzVreHNrMDJ2NDNlbXhudTkxMGI3aiJ9.0zBA_9egcHq59cvlpytLoA'
    )
  },
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
