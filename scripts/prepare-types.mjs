import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entryDts = resolve(root, 'dist/types/Money.d.ts');
const indexDts = resolve(root, 'dist/types/index.d.ts');

if (!existsSync(entryDts)) {
  console.error('Missing dist/types/Money.d.ts — run tsc first');
  process.exit(1);
}

writeFileSync(
  indexDts,
  [
    "export { default } from './Money';",
    "export * from './Money';",
    '',
  ].join('\n'),
);

const types = './dist/types/index.d.ts';
const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.types = types;
pkg.typings = types;
if (pkg.exports?.['.'] && typeof pkg.exports['.'] === 'object') {
  pkg.exports['.'].types = types;
}
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('Prepared dist/types/index.d.ts');
