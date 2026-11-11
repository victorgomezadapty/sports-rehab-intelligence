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
    for (const study of manifest.studies) {
      const indexPath = path.join(siteDir, study.route.replace(/^\//, ''), 'index.html');
      const spanishPath = path.join(siteDir, 'es', study.route.replace(/^\//, ''), 'index.html');
      const index = await readFile(indexPath, 'utf8');
      const spanish = await readFile(spanishPath, 'utf8');
      assert.match(index, /<html\b[^>]*\slang="en"/i, study.route);
      assert.match(spanish, /<html\b[^>]*\slang="es"/i, study.route);
      assert.doesNotMatch(index, /<html\b[^>]*\slang="es"/i, study.route);
      const ogTitle = index.match(/property="og:title" content="([^"]*)"/);
      if (ogTitle) assert.equal(/\b(historial|coste|registros|análisis|analisis)\b/i.test(ogTitle[1]), false, ogTitle[1]);
      const spanishOg = spanish.match(/property="og:title" content="([^"]*)"/);
      if (spanishOg) assert.equal(/\b(historial|coste|El )\b/.test(spanishOg[1]) || /[áéíóúñ]/i.test(spanishOg[1]), true, spanishOg[1]);
    }
    const runnersApp = await readFile(path.join(siteDir, 'studies/competitive-runners-injury-risk/app.js'), 'utf8');
    const footballApp = await readFile(path.join(siteDir, 'studies/european-football-injuries/app.js'), 'utf8');
    assert.match(runnersApp, /documentElement\.lang/);
    assert.match(footballApp, /documentElement\.lang/);
    const football = await readFile(path.join(siteDir, 'studies/european-football-injuries/index.html'), 'utf8');
    assert.match(football, /The cost of being absent/);
    assert.doesNotMatch(football, /property="og:title" content="[^"]*coste/);
    const footballEs = await readFile(path.join(siteDir, 'es/studies/european-football-injuries/index.html'), 'utf8');
    assert.match(footballEs, /El coste de no estar/);
    const runners = await readFile(path.join(siteDir, 'studies/competitive-runners-injury-risk/index.html'), 'utf8');
    assert.match(runners, /The history comes before/);
    assert.doesNotMatch(runners, /property="og:title" content="[^"]*historial/);
    const clinicEs = await readFile(path.join(siteDir, 'es/studies/running-injury-clinic/index.html'), 'utf8');
    assert.match(clinicEs, /Biomecánica y fenotipado/);
    const footballEvidence = await readFile(path.join(siteDir, 'studies/european-football-injuries/evidence.html'), 'utf8');
    const hiddenSpanish = footballEvidence.match(/<div class="lang-content"[^>]*data-content-lang="es"[^>]*>/);
    const visibleEnglish = footballEvidence.match(/<div class="lang-content"[^>]*data-content-lang="en"[^>]*>/);
    assert.ok(hiddenSpanish && /\shidden(?:\s|>)/.test(hiddenSpanish[0]));
    assert.ok(visibleEnglish && !/\shidden(?:\s|>)/.test(visibleEnglish[0]));
  } finally {
    await rm(siteDir, { recursive: true, force: true });
  }
});
