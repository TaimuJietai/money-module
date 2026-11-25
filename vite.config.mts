import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkgPath = resolve(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  version: string;
  [key: string]: unknown;
};
const version = pkg.version;

function syncPackageEntries() {
  const main = `./dist/money.v${version}.cjs`;
  const modulePath = `./dist/money.v${version}.mjs`;
  const browser = `./dist/money.min.v${version}.js`;
  const types = './dist/types/index.d.ts';

  pkg.main = main;
  pkg.module = modulePath;
  pkg.browser = browser;
  pkg.types = types;
  pkg.typings = types;
  pkg.unpkg = browser;
  pkg.jsdelivr = browser;
  pkg.exports = {
    '.': {
      types,
      import: modulePath,
      require: main,
      default: modulePath,
    },
  };
  pkg.files = ['dist', 'README.md', 'README-CN.md'];

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const examplePath = resolve(__dirname, 'example.html');
  if (existsSync(examplePath)) {
    let example = readFileSync(examplePath, 'utf8');
    example = example.replace(
      /src="\.\/dist\/money\.min(?:\.v[\d.]+)?\.js"/,
      `src="./dist/money.min.v${version}.js"`,
    );
    writeFileSync(examplePath, example);
  }
}

export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    {
      name: 'sync-package-entries',
      closeBundle() {
        syncPackageEntries();
      },
    },
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/Money.ts'),
      name: 'Money',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        if (format === 'es') return `money.v${version}.mjs`;
        if (format === 'cjs') return `money.v${version}.cjs`;
        return `money.min.v${version}.js`;
      },
    },
    rollupOptions: {
      output: {
        exports: 'default',
      },
    },
    minify: 'esbuild',
    // 发布给引入方不需要 sourcemap
    sourcemap: false,
    emptyOutDir: true,
  },
});
