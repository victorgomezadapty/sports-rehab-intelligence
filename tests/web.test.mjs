import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { summarizeAtlas } from '../web/synthesis.js';
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const atlas = JSON.parse(read('web/data/atlas.json'));

test('the atlas retains three source-specific outcomes and all original catalogue namespaces', () => {
  assert.equal(atlas.sources.length, 3);
  assert.equal(new Set(atlas.sources.map((source) => source.outcome)).size, 3);
  assert.equal(new Set(atlas.catalog.map((row) => row.catalog_key)).size, 104);
  for (const key of ['pooled_population_count', 'pooled_injury_count', 'cross_source_effect_estimate']) assert.equal(atlas[key], null);
});

test('all relative public links and download targets resolve inside the static site', () => {
  const routes = new Set(JSON.parse(read('studies/sources.json')).studies.map((study) => `/${study.route}/`));
  for (const file of ['web/index.html', 'web/evidence.html']) {
    for (const [, target] of read(file).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|#|data:)/.test(target) || target === '/') continue;
      if (target.startsWith('/#')) continue;
      if (routes.has(target)) continue;
      assert(existsSync(new URL(`web/${target}`, root)), `${file}: ${target}`);
    }
  }
});

test('the three component studies and research resources are linked', () => {
  const app = read('web/app.js');
  const index = read('web/index.html');
  const evidence = read('web/evidence.html');
  const routes = JSON.parse(read('studies/sources.json')).studies.map((study) => `/${study.route}/`);
  for (const slug of ['running-injury-clinic', 'competitive-runners-injury-risk', 'european-football-injuries']) assert(app.includes(slug));
  for (const route of routes) {
    assert(index.includes(`href="${route}"`), route);
    assert(evidence.includes(`href="${route}"`), route);
  }
  assert(app.includes('class="experience-link" href="/studies/${content.slug}/"'));
  assert(app.includes('https://${content.slug}.vercel.app'));
  for (const host of ['github.com', 'kaggle.com', 'victor-gomez-portfolio.vercel.app']) assert(index.includes(host));
  assert(index.includes('id="motion"'));
  assert(read('web/styles.css').includes('prefers-reduced-motion'));
  assert(read('web/studies/hub.css').includes('prefers-reduced-motion'));
});

test('chart inputs preserve denominators and sensitivity views', () => {
  assert.equal(atlas.charts.runners_primary_validation.length, 3);
  for (const row of atlas.charts.runners_primary_validation) assert(Math.abs(Number(row.Labels) / Number(row.Rows) - Number(row['Label fraction'])) < 1e-12);
  assert.deepEqual(atlas.charts.football_duplicate_sensitivity.map((row) => Number(row.record_count)), [15603, 14611]);
  assert.equal(atlas.charts.ric_pilot_descriptives.length, 26);
});

test('published conclusions distinguish record frequency from accumulated burden', () => {
  const result = summarizeAtlas(atlas);
  assert.equal(result.mostFrequent.injury_type_raw, 'Hamstring injury');
  assert.equal(result.greatestBurden.injury_type_raw, 'Cruciate ligament tear');
  assert.equal(Number(result.mostFrequent.injury_count), 1256);
  assert.equal(Number(result.greatestBurden.total_days_out), 56768);
  assert(Number(result.mostFrequent.injury_count) > Number(result.greatestBurden.injury_count));
  assert(Number(result.mostFrequent.total_days_out) < Number(result.greatestBurden.total_days_out));
});

test('runners synthesis refers to the combined held-out test and its own denominator', () => {
  const result = summarizeAtlas(atlas);
  assert.equal(result.testRows, 7596);
  assert.equal(result.testLabels, 122);
  assert(Math.abs(result.positiveFraction - 122 / 7596) < 1e-12);
  assert(Math.abs(result.averagePrecision - .0199905668050038) < 1e-12);
});

test('movement medians preserve source signs and the scene is explicitly illustrative', () => {
  const knee = atlas.charts.ric_pilot_descriptives.filter((row) => row.feature === 'KNEE_FLEX_PEAK_ANGLE');
  assert(knee.every((row) => Number(row.median) < 0));
  const result = summarizeAtlas(atlas);
  assert.equal(result.pilotN, 30);
  assert.equal(result.strideLeft, 81.6364);
  assert.equal(result.strideRight, 81.6364);
  const html = read('web/index.html');
  for (const section of ['conclusions', 'movement', 'integration-result']) assert(html.includes(`id="${section}"`));
  assert(html.includes('No reconstruye cinemática real'));
});
