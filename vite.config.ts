/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const accessOwnSources = () => {
  return {
    name: 'access-own-package-sources',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.startsWith('@ekwoka') && !id.endsWith('src')) {
        return {
          id: resolve(`./packages/${id.replace('@ekwoka/', '')}/src`),
          external: false,
        };
      }
    },
  };
};

export default defineConfig({
  root: resolve(__dirname),
  plugins: [tsconfigPaths(), accessOwnSources()],
  build: {
    target: 'esnext',
  },
  test: {
    globals: true,
    include: ['./**/*{.spec,.test}.{ts,tsx}'],
    includeSource: ['./**/*.{ts,tsx}'],
    reporters: ['dot'],
    environment: 'happy-dom',
    deps: {},
    useAtomics: true,
    passWithNoTests: true,
  },
});
