import { readdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

function removeMaps(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      removeMaps(full);
      continue;
    }
    if (name.endsWith('.map')) {
      rmSync(full);
      console.log(`removed ${full.replace(`${root}/`, '')}`);
    }
  }
}

removeMaps(dist);
console.log('Publish artifacts cleaned (source maps removed)');
