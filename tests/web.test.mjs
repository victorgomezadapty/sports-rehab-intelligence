import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
  for (const file of ['web/index.html', 'web/evidence.html']) {
    for (const [, target] of read(file).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|#|data:)/.test(target) || target === '/') continue;
      if (target.startsWith('/#')) continue;
      assert(existsSync(new URL(`web/${target}`, root)), `${file}: ${target}`);
    }
  }
});

test('the three component studies and research resources are linked', () => {
  const app = read('web/app.js');
  const index = read('web/index.html');
  for (const slug of ['running-injury-clinic', 'competitive-runners-injury-risk', 'european-football-injuries']) assert(app.includes(slug));
  for (const host of ['github.com', 'kaggle.com', 'victor-gomez-portfolio.vercel.app']) assert(index.includes(host));
  assert(index.includes('id="motion"'));
  assert(read('web/styles.css').includes('prefers-reduced-motion'));
});

test('chart inputs preserve denominators and sensitivity views', () => {
  assert.equal(atlas.charts.runners_primary_validation.length, 3);
  for (const row of atlas.charts.runners_primary_validation) assert(Math.abs(Number(row.Labels) / Number(row.Rows) - Number(row['Label fraction'])) < 1e-12);
  assert.deepEqual(atlas.charts.football_duplicate_sensitivity.map((row) => Number(row.record_count)), [15603, 14611]);
  assert.equal(atlas.charts.ric_pilot_descriptives.length, 26);
});
