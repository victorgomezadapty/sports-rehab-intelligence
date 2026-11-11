import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { embedStudies } from './embed-studies.mjs';
import { writeAtlasLocales } from './localize-html.mjs';
const root = new URL('../', import.meta.url);
const atlas = JSON.parse(await readFile(new URL('web/data/atlas.json', root), 'utf8'));
if (atlas.sources.length !== 3 || atlas.catalog.length !== 104 || atlas.matrix.domains.length !== 9) throw new Error('Run python scripts/build_release.py and review the data contract.');
if (atlas.pooled_population_count !== null || atlas.pooled_injury_count !== null || atlas.cross_source_effect_estimate !== null) throw new Error('Atlas build must not invent a pooled clinical result.');
// This script owns only its fixed dist directory inside this repository.
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root), { recursive: true });
await cp(new URL('web/', root), new URL('dist/', root), { recursive: true });
const siteDir = fileURLToPath(new URL('dist/', root));
const manifest = await embedStudies({ siteDir });
if (manifest.datasets_fused || manifest.combined_clinical_inference) throw new Error('Study routes must stay independent.');
await writeAtlasLocales(siteDir);
console.log('Static atlas built in dist/. English is the default document. Spanish is published under /es/.');
