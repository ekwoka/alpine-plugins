/// <reference types="vitest" />
import { resolve } from 'node:path';
import { alpineTestingPlugin } from 'testing-library-alpine';
import { defineConfig } from 'vite';

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
console.log('defining config');
export default defineConfig({
  root: resolve(__dirname),
  plugins: [accessOwnSources(), alpineTestingPlugin()],
  build: {
    target: 'esnext',
  },
  resolve: {
    mainFields: ['module', 'main'],
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
