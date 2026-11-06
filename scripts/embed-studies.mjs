import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['vercel.json', 'package.json', 'package-lock.json', 'test.mjs', 'build.mjs', 'evidence.template.html']);
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.md']);

export function mapStudyUrl(raw, files, base) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null;
  const hashAt = raw.indexOf('#');
  const beforeHash = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
  const hash = hashAt >= 0 ? raw.slice(hashAt) : '';
  const queryAt = beforeHash.indexOf('?');
  const pathname = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const query = queryAt >= 0 ? beforeHash.slice(queryAt) : '';
  const trimmed = pathname.replace(/\/+$/, '');
  let relative = trimmed === '' ? 'index.html' : trimmed.slice(1);
  if (!files.has(relative)) {
    if (files.has(`${relative}.html`)) relative = `${relative}.html`;
    else if (files.has(`${relative}/index.html`)) relative = `${relative}/index.html`;
    else return null;
  }
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${relative === 'index.html' ? '' : relative}${query}${hash}`;
}

function rewriteText(text, files, base) {
  const swap = (url) => mapStudyUrl(url, files, base) ?? url;
  return text
    .replace(/(\s(?:href|src|poster)\s*=\s*)(["'])(\/[^"']*)\2/gi, (match, attr, quote, url) => {
      const mapped = mapStudyUrl(url, files, base);
      return mapped ? `${attr}${quote}${mapped}${quote}` : match;
    })
    .replace(/url\(\s*(["']?)(\/[^"')]+)\1\s*\)/g, (match, quote, url) => `url(${quote}${swap(url)}${quote})`)
    .replace(/fetch\(\s*(["'])(\/[^"']*)\1/g, (match, quote, url) => `fetch(${quote}${swap(url)}${quote}`);
}

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed\n${result.stderr || result.stdout}`);
  return (result.stdout || '').trim();
}

async function materialize(study, cacheRoot) {
  const override = process.env[`SRI_STUDY_DIR_${study.id}`]
    || (process.env.SRI_STUDY_ROOT ? path.join(process.env.SRI_STUDY_ROOT, study.repo) : '');
  if (override) {
    const frontend = path.join(override, study.path);
    await stat(frontend);
    const head = git(['rev-parse', 'HEAD'], override);
    if (head !== study.commit) throw new Error(`${study.id} checkout ${head} does not match pin ${study.commit}`);
    return frontend;
  }
  const dest = path.join(cacheRoot, study.id);
  const marker = path.join(dest, '.pin');
  try {
    if ((await readFile(marker, 'utf8')).trim() === study.commit) return path.join(dest, study.path);
  } catch {}
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  git(['init', '-q'], dest);
  git(['remote', 'add', 'origin', study.url], dest);
  git(['fetch', '--depth', '1', 'origin', study.commit], dest);
  git(['sparse-checkout', 'set', '--cone', study.path], dest);
  git(['checkout', '--detach', 'FETCH_HEAD'], dest);
  await writeFile(marker, `${study.commit}\n`);
  return path.join(dest, study.path);
}

function hubBar(study, studies) {
  const short = study.commit.slice(0, 7);
  const links = [
    ['/', 'Atlas', 'Atlas', false],
    ['/evidence.html', 'Evidencia', 'Evidence', false],
    ...studies.map((item) => [`/${item.route}/`, item.label_es, item.label_en, item.id === study.id]),
  ];
  const anchors = links.map(([href, es, en, current]) => `<a href="${href}"${current ? ' aria-current="page"' : ''} data-sri-es="${es}" data-sri-en="${en}">${es}</a>`).join('');
  return `<div class="sri-hub" data-study="${study.id}"><a class="sri-hub-brand" href="/">SRI</a><div class="sri-hub-links">${anchors}</div><p class="sri-hub-note"><span data-sri-es="Estudio independiente, commit ${short}. Sus datos no se fusionan con los demás." data-sri-en="Independent study, commit ${short}. Its data is not fused with the others.">Estudio independiente, commit ${short}. Sus datos no se fusionan con los demás.</span> <a href="https://github.com/victorgomezadapty/${study.repo}/tree/${study.commit}">GitHub</a></p><button type="button" data-sri-lang aria-label="Switch to English">EN</button></div>`;
}

function injectHub(html, study, studies) {
  const assets = `<meta name="sri-study-base" content="/${study.route}/"><link rel="stylesheet" href="/studies/hub.css"><script src="/studies/hub.js" defer></script>`;
  if (/<script\b/i.test(html)) html = html.replace(/<script\b/i, `${assets}<script`);
  else html = html.replace(/<\/head>/i, `${assets}</head>`);
  const bar = hubBar(study, studies);
  if (/<a\b[^>]*class="[^"]*skip[^"]*"[^>]*>[\s\S]*?<\/a>/i.test(html)) {
    html = html.replace(/(<a\b[^>]*class="[^"]*skip[^"]*"[^>]*>[\s\S]*?<\/a>)/i, `$1${bar}`);
  } else html = html.replace(/<body([^>]*)>/i, `<body$1>${bar}`);
  return html;
}

async function listFiles(dir, prefix = '') {
  const files = new Set();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      for (const nested of await listFiles(path.join(dir, entry.name), relative)) files.add(nested);
    } else files.add(relative);
  }
  return files;
}

async function rewriteTree(dir, files, base) {
  for (const relative of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(relative))) continue;
    const full = path.join(dir, relative);
    const original = await readFile(full, 'utf8');
    const rewritten = rewriteText(original, files, base);
    if (rewritten !== original) await writeFile(full, rewritten);
  }
}

function mustInclude(text, needles, label) {
  for (const needle of needles) if (!text.includes(needle)) throw new Error(`${label} is missing ${needle}`);
}

async function assertExperience(study, dir) {
  const index = await readFile(path.join(dir, 'index.html'), 'utf8');
  mustInclude(index, ['class="sri-hub"', `data-study="${study.id}"`, '/studies/hub.js', `content="/${study.route}/"`], study.id);
  if (study.id === 'running-injury-clinic') {
    mustInclude(index, ['id="smd-chart"', 'id="stability-list"', 'id="phase-slider"', 'data-count="30"', 'not future-injury prediction', 'EVENT VALIDATION PENDING'], study.id);
    const extras = JSON.parse(await readFile(path.join(dir, 'data/extras.json'), 'utf8'));
    if (extras.covariate_balance.length !== 5) throw new Error('RIC covariate balance did not keep 5 covariates');
    if (extras.repeated_summary.repeated_participants_with_different_earliest_latest_status.n !== 20) throw new Error('RIC label stability count changed');
    await stat(path.join(dir, 'runner.js'));
    const app = await readFile(path.join(dir, 'app.js'), 'utf8');
    if (!app.includes("fetch('data/extras.json')")) throw new Error('RIC pilot data request was rewritten away from its own file');
  }
  if (study.id === 'competitive-runners-injury-risk') {
    mustInclude(index, ['id="athlete"', 'id="validation"', 'id="contrasts"', 'data-protocol="unseen_athlete_temporal"', 'AUC of 0.546', '0,546', 'full fitness before and after'], study.id);
    const data = JSON.parse(await readFile(path.join(dir, 'data.json'), 'utf8'));
    if (data.athletes.length !== 5) throw new Error(`Runners experience has ${data.athletes.length} athlete stories`);
    const metric = data.metrics.find((row) => row.protocol === 'unseen_athlete_temporal' && row.model === 'logistic_load_response_sigmoid');
    if (!metric || Math.abs(metric.roc_auc - 0.545594125208) > 1e-12) throw new Error('Held-out runners AUC is not the pinned non-clinical result');
    const contrasts = new Set(data.contrasts.map((row) => row.window_days));
    if (!contrasts.has(7) || !contrasts.has(3)) throw new Error('Pre-event contrast windows are missing');
    const app = await readFile(path.join(dir, 'app.js'), 'utf8');
    if (app.includes("fetch('/data.json')")) throw new Error('Runners data request still points at the site root');
    if (!app.includes(`fetch('/${study.route}/data.json')`)) throw new Error('Runners data request was not mounted on its route');
  }
  if (study.id === 'european-football-injuries') {
    mustInclude(index, ['id="league-filter"', 'id="season-filter"', 'id="scope-filter"', 'value="injury"', 'value="all"', 'id="regions"', 'id="season-chart"', '15.603', '15,603', 'No son tasas de incidencia', 'They are not incidence rates'], study.id);
    const project = JSON.parse(await readFile(path.join(dir, 'data/project.json'), 'utf8'));
    if (project.summary.analysis_records !== 15603) throw new Error('Football absence count is not 15,603');
    if (!project.views.raw['all|all'] || !project.views.raw['Bundesliga|21/22']) throw new Error('Football season and league slices are missing');
    const app = await readFile(path.join(dir, 'app.js'), 'utf8');
    if (app.includes("fetch('/data/project.json')")) throw new Error('Football data request still points at the site root');
    if (!app.includes(`fetch('/${study.route}/data/project.json')`)) throw new Error('Football data request was not mounted on its route');
    const evidence = await readFile(path.join(dir, 'evidence.html'), 'utf8');
    if (!evidence.includes(`/${study.route}/downloads/literature_search.md`)) throw new Error('Football evidence links were not mounted on the route');
  }
}

export async function loadSources(root = repoRoot) {
  const sources = JSON.parse(await readFile(path.join(root, 'studies/sources.json'), 'utf8'));
  if (sources.studies.length !== 3) throw new Error('Expected three independent study routes');
  for (const study of sources.studies) {
    if (!/^studies\/[a-z0-9-]+$/.test(study.route)) throw new Error(`Unsafe study route ${study.route}`);
    if (!/^[0-9a-f]{40}$/.test(study.commit)) throw new Error(`Study pin must be a full commit: ${study.id}`);
  }
  return sources;
}

export async function embedStudies({ siteDir, cacheRoot = path.join(repoRoot, '.study-cache'), root = repoRoot } = {}) {
  const sources = await loadSources(root);
  const provenance = [];
  for (const study of sources.studies) {
    const frontend = await materialize(study, cacheRoot);
    const destination = path.join(siteDir, study.route);
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    await cp(frontend, destination, {
      recursive: true,
      filter: (source) => !SKIP.has(path.basename(source)) && path.basename(source) !== '.git' && path.basename(source) !== 'node_modules',
    });
    const indexPath = path.join(destination, 'index.html');
    const sourceIndex = await readFile(indexPath);
    let files = await listFiles(destination);
    const base = `/${study.route}/`;
    await rewriteTree(destination, files, base);
    files = await listFiles(destination);
    for (const relative of [...files].filter((file) => file.endsWith('.html'))) {
      const full = path.join(destination, relative);
      await writeFile(full, injectHub(await readFile(full, 'utf8'), study, sources.studies));
    }
    await assertExperience(study, destination);
    provenance.push({
      id: study.id,
      repo: study.repo,
      url: study.url,
      commit: study.commit,
      path: study.path,
      route: `/${study.route}/`,
      source_index_sha256: createHash('sha256').update(sourceIndex).digest('hex'),
      datasets_fused: false,
      combined_clinical_inference: false,
    });
  }
  const manifest = { datasets_fused: false, combined_clinical_inference: false, studies: provenance };
  await writeFile(path.join(siteDir, 'studies/provenance.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const siteDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repoRoot, 'dist');
  const manifest = await embedStudies({ siteDir });
  console.log(`Mounted ${manifest.studies.length} study experiences in ${siteDir}`);
}
