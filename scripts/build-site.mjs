import { cp, mkdir, readFile, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const atlas = JSON.parse(await readFile(new URL('web/data/atlas.json', root), 'utf8'));
if (atlas.sources.length !== 3 || atlas.catalog.length !== 104 || atlas.matrix.domains.length !== 9) throw new Error('Run python scripts/build_release.py and review the data contract.');
// This script owns only its fixed dist directory inside this repository.
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root), { recursive: true });
await cp(new URL('web/', root), new URL('dist/', root), { recursive: true });
console.log('Static atlas built in dist/.');
