/// <reference types="vitest" />
import { resolve } from 'node:path';
import { alpineTestingPlugin } from 'testing-library-alpine';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    dts({
      entryRoot: resolve(__dirname, 'src'),
      tsconfigPath: resolve(__dirname, 'tsconfig.json'),
    }),
    alpineTestingPlugin(),
  ],
  define: {
    'import.meta.vitest': 'undefined',
    'import.meta.DEBUG': 'false',
  },
  build: {
    target: 'esnext',
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: ({ name: fileName }) => {
          return `${fileName}.js`;
        },
      },
    },
    sourcemap: true,
  },
  test: {
    globals: true,
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    deps: {},
    passWithNoTests: true,
  },
});
