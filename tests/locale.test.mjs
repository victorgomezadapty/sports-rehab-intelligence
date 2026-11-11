import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localizeAtlasHtml, localizeDocument, looksSpanish, preferHtmlLanguage, loadCopyEs, extractPairs } from '../scripts/localize-html.mjs';
import { redirectTarget } from '../scripts/redirects.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');

test('english and spanish atlas documents keep both languages and the right preview', () => {
  const source = read('web/index.html');
  const english = localizeAtlasHtml(source, 'en', 'home');
  const spanish = localizeAtlasHtml(source, 'es', 'home');
  assert.equal(localizeAtlasHtml(english, 'en', 'home'), english);
  assert.match(english, /<html\b[^>]*\slang="en"/);
  assert.match(spanish, /<html\b[^>]*\slang="es"/);
  assert.match(english, /<title>Sports Rehab Intelligence · Three studies, one connected perspective<\/title>/);
  assert.match(spanish, /<title>Sports Rehab Intelligence · Tres estudios, una visión conectada<\/title>/);
  assert.match(english, /property="og:title" content="Sports Rehab Intelligence · Three studies, one connected perspective"/);
  assert.match(english, /property="og:description" content="Movement\. Training\. Injury consequences\. Three independent studies, one evidence atlas\."/);
  assert.match(spanish, /property="og:title" content="Sports Rehab Intelligence · Tres estudios, una visión conectada"/);
  assert.match(spanish, /property="og:description" content="Un atlas de evidencia que reúne biomecánica, entrenamiento y consecuencias de la lesión\. Tres estudios independientes, una línea de investigación reproducible\."/);
  assert.match(english, /property="og:image" content="https:\/\/sports-rehab-intelligence\.vercel\.app\/cover\.svg"/);
  assert.match(english, /hreflang="en" href="https:\/\/sports-rehab-intelligence\.vercel\.app\/"/);
  assert.match(english, /hreflang="es" href="https:\/\/sports-rehab-intelligence\.vercel\.app\/es\/"/);
  assert.match(english, /hreflang="x-default" href="https:\/\/sports-rehab-intelligence\.vercel\.app\/"/);
  assert.match(english, /rel="canonical" href="https:\/\/sports-rehab-intelligence\.vercel\.app\/"/);
  assert.match(spanish, /rel="canonical" href="https:\/\/sports-rehab-intelligence\.vercel\.app\/es\/"/);
  assert.match(english, /data-en="Three studies\.">Three studies\.</);
  assert.match(english, /data-es="Tres estudios\."/);
  assert.match(spanish, /data-en="Three studies\.">Tres estudios\.</);
  assert.match(english, /id="language"[^>]*href="\/es\/"[^>]*>ES<\/a>/);
  assert.match(spanish, /id="language"[^>]*href="\/"[^>]*>EN<\/a>/);
  assert.match(english, /Animated runner diagram/);
  assert.match(spanish, /Esquema animado de un corredor/);
  assert.equal(looksSpanish('Sports Rehab Intelligence · Three studies, one connected perspective'), false);
  assert.equal(looksSpanish('Tres estudios, una visión conectada'), true);
  assert.match(spanish, /src="\/app\.js"/);
  assert.match(spanish, /href="\/es\/evidence\.html"/);
  assert.match(spanish, /href="\/es\/studies\/running-injury-clinic\/"/);
  assert.match(spanish, /href="\/styles\.css"|href="\/favicon\.svg"/);
  assert.doesNotMatch(spanish, /href="\/es\/styles\.css"/);
  assert.match(spanish, /https:\/\/sports-rehab-intelligence\.vercel\.app\/es\/studies\/competitive-runners-injury-risk\//);
});

test('evidence keeps its existing english and spanish titles', () => {
  const source = read('web/evidence.html');
  const english = localizeAtlasHtml(source, 'en', 'evidence');
  const spanish = localizeAtlasHtml(source, 'es', 'evidence');
  assert.match(english, /<html\b[^>]*\slang="en"/);
  assert.match(english, /<title>Evidence and methods · Sports Rehab Intelligence<\/title>/);
  assert.match(english, /name="description" content="The question: which movement, training and injury-consequence dimensions are observed, and which data and validation are needed to connect them\?"/);
  assert.match(spanish, /<title>Evidencia y métodos · Sports Rehab Intelligence<\/title>/);
  assert.match(spanish, /Discusión, métodos, atribución y referencias primarias/);
  assert.match(english, /href="\/es\/evidence\.html"/);
  assert.match(spanish, /href="\/evidence\.html"/);
  assert.doesNotMatch(english, /property="og:title"/);
});

test('published atlas files match the locale renderer', () => {
  for (const [file, kind] of [['web/index.html', 'home'], ['web/evidence.html', 'evidence'], ['web/es/index.html', 'home'], ['web/es/evidence.html', 'evidence']]) {
    const html = read(file);
    const lang = file.includes('/es/') ? 'es' : 'en';
    assert.equal(localizeAtlasHtml(html, lang, kind), html, file);
  }
});

test('bilingual markup with breaks and hidden language blocks round trips', () => {
  const html = `<!doctype html><html lang="es"><head><title>Competitive Runners · El historial antes del evento</title><meta name="description" content="Entrenamiento, recuperación y eventos de lesión en corredores competitivos. Estudio reproducible con validación temporal y por atleta."><meta property="og:title" content="Competitive Runners · El historial antes del evento"><meta property="og:description" content="74 atletas. Historias individuales. Una pregunta sobre el tiempo, la carga y los límites de la predicción."><meta property="og:image" content="https://example.com/cover.png"></head><body><h1 data-es="El evento es un día.<br>La historia viene antes." data-en="The event is one day.<br>The history comes before.">El evento es un día.<br>La historia viene antes.</h1><p class="lede" data-es="Carga, intensidad y recuperación cambian con el tiempo en este proyecto de corredores." data-en="Load, intensity and recovery change over time. This project follows those trajectories in competitive runners.">Carga, intensidad y recuperación cambian con el tiempo en este proyecto de corredores.</p><div class="lang-content" data-content-lang="es">Español</div><div class="lang-content" data-content-lang="en" hidden>English</div><script src="app.js"></script></body></html>`;
  const english = localizeDocument(html, { lang: 'en', enPath: '/studies/competitive-runners-injury-risk/', esPath: '/es/studies/competitive-runners-injury-risk/', pageDir: '/studies/competitive-runners-injury-risk/', pairs: new Map(), social: 'study' });
  assert.match(english, /<html\b[^>]*\slang="en"/);
  assert.match(english, /The event is one day\.<br>The history comes before\./);
  assert.match(english, /property="og:title" content="Competitive Runners · The event is one day\. The history comes before\."/);
  assert.match(english, /Load, intensity and recovery change over time/);
  assert.match(english, /data-content-lang="en"/);
  assert.match(english, /data-content-lang="es"[^>]*hidden/);
  assert.match(english, /src="app\.js"/);
  const spanish = localizeDocument(html, { lang: 'es', enPath: '/studies/competitive-runners-injury-risk/', esPath: '/es/studies/competitive-runners-injury-risk/', pageDir: '/studies/competitive-runners-injury-risk/', pairs: new Map(), social: 'study' });
  assert.match(spanish, /<html\b[^>]*\slang="es"/);
  assert.match(spanish, /El historial antes del evento/);
  assert.match(spanish, /src="\/studies\/competitive-runners-injury-risk\/app\.js"/);
});

test('study copy and language fallback stay attached to the document language', () => {
  const js = `const copy = { es: { heroLead: "Lectura prudente." } };\ncopy.es.heroLead = "Lectura prudente actualizada.";\ncopy.en = {};\ndocument.title = next === 'es' ? 'Running Injury Clinic · Biomecánica y fenotipado de lesiones' : 'Running Injury Clinic · Biomechanics and injury phenotyping';`;
  assert.equal(loadCopyEs(js).heroLead, 'Lectura prudente actualizada.');
  const pairs = extractPairs(js);
  assert.equal(pairs.get('Running Injury Clinic · Biomecánica y fenotipado de lesiones'), 'Running Injury Clinic · Biomechanics and injury phenotyping');
  const patched = preferHtmlLanguage("let lang=localStorage.getItem('runners-language')||'es';\nlet lang = params.get('lang') === 'en' ? 'en' : params.get('lang') === 'es' ? 'es' : localStorage.getItem('football-language') === 'en' ? 'en' : 'es';");
  assert.match(patched, /documentElement\.lang/);
  assert.doesNotMatch(patched, /\|\|'es'/);
  assert.doesNotMatch(patched, /: 'es'/);
});

test('language aliases redirect and the default paths do not', () => {
  assert.deepEqual(redirectTarget('/'), null);
  assert.deepEqual(redirectTarget('/studies/running-injury-clinic/'), null);
  assert.deepEqual(redirectTarget('/en'), { status: 308, location: '/' });
  assert.deepEqual(redirectTarget('/en/studies/running-injury-clinic/'), { status: 308, location: '/studies/running-injury-clinic/' });
  assert.deepEqual(redirectTarget('/', 'lang=es'), { status: 307, location: '/es/' });
  assert.deepEqual(redirectTarget('/studies/european-football-injuries/', '?lang=es'), { status: 307, location: '/es/studies/european-football-injuries/' });
  assert.deepEqual(redirectTarget('/es/studies/european-football-injuries/', 'lang=en'), { status: 307, location: '/studies/european-football-injuries/' });
  assert.deepEqual(redirectTarget('/es'), { status: 308, location: '/es/' });
  assert.equal(redirectTarget('/es/', 'lang=es'), null);
  const vercel = JSON.parse(read('vercel.json'));
  const sources = vercel.redirects.map((rule) => rule.source);
  assert.ok(sources.includes('/en'));
  assert.ok(sources.includes('/en/:path*'));
  assert.ok(vercel.redirects.some((rule) => rule.destination === '/es/' && rule.has?.some((item) => item.key === 'lang' && item.value === 'es')));
  assert.ok(vercel.redirects.some((rule) => rule.destination === '/es/studies/:path*'));
  const sitemap = read('web/sitemap.xml');
  assert.match(sitemap, /hreflang="x-default"/);
  assert.match(sitemap, /\/es\/studies\/running-injury-clinic\//);
});
