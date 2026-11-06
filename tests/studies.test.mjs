import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedStudies, mapStudyUrl } from '../scripts/embed-studies.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('study root paths mount under their route and unknown paths stay untouched', () => {
  const files = new Set(['index.html', 'evidence.html', 'styles.css', 'app.js', 'data.json', 'data/project.json', 'downloads/results.zip']);
  const base = '/studies/competitive-runners-injury-risk/';
  assert.equal(mapStudyUrl('/data.json', files, base), `${base}data.json`);
  assert.equal(mapStudyUrl('/', files, base), base);
  assert.equal(mapStudyUrl('/#athletes', files, base), `${base}#athletes`);
  assert.equal(mapStudyUrl('/evidence', files, '/studies/european-football-injuries/'), '/studies/european-football-injuries/evidence.html');
  assert.equal(mapStudyUrl('/data/project.json', files, '/studies/european-football-injuries/'), '/studies/european-football-injuries/data/project.json');
  assert.equal(mapStudyUrl('styles.css', files, base), null);
  assert.equal(mapStudyUrl('https://example.com/data.json', files, base), null);
  assert.equal(mapStudyUrl('/not-a-study-file', files, base), null);
});

test('pinned study frontends mount as separate routes without fused data', { timeout: 180000 }, async () => {
  const siblings = '/tmp/siblings';
  if (!process.env.SRI_STUDY_ROOT && existsSync(path.join(siblings, 'running-injury-clinic', 'site', 'index.html'))) {
    process.env.SRI_STUDY_ROOT = siblings;
  }
  const siteDir = await mkdtemp(path.join(tmpdir(), 'sri-routes-'));
  try {
    await cp(new URL('../web/', import.meta.url), siteDir, { recursive: true });
    const manifest = await embedStudies({ siteDir, cacheRoot: path.join(siteDir, '.cache'), root });
    assert.equal(manifest.datasets_fused, false);
    assert.equal(manifest.combined_clinical_inference, false);
    assert.equal(manifest.studies.length, 3);
    assert.equal(existsSync(path.join(root, 'web/studies/running-injury-clinic/index.html')), false);
    const atlas = JSON.parse(await readFile(new URL('../web/data/atlas.json', import.meta.url), 'utf8'));
    assert.equal(atlas.catalog.length, 104);
    assert.equal(atlas.matrix.domains.length, 9);
    assert.equal(atlas.sources.length, 3);
    assert.equal(atlas.pooled_population_count, null);
    const provenance = JSON.parse(await readFile(path.join(siteDir, 'studies/provenance.json'), 'utf8'));
    assert.deepEqual(provenance.studies.map((study) => study.route), manifest.studies.map((study) => study.route));
    for (const study of manifest.studies) assert.equal(study.datasets_fused, false);
  } finally {
    await rm(siteDir, { recursive: true, force: true });
  }
});
