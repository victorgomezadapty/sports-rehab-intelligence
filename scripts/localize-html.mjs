import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ORIGIN = 'https://sports-rehab-intelligence.vercel.app';
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const ASSET = /\.(?:css|js|mjs|json|svg|png|jpe?g|gif|webp|csv|md|zip|bib|ipynb|txt|woff2?)$/i;
const SPANISH_WORD = /\b(el|la|los|las|del|al|una|unos|unas|que|con|por|para|entreno|lesión|lesion|historial|discusión|discusion|evidencia|métodos|metodos|coste|estar|registros|fútbol|futbol|análisis|analisis|día|dias|días)\b/i;

const ATLAS = {
  home: {
    enPath: '/',
    esPath: '/es/',
    og: true,
    en: {
      title: 'Sports Rehab Intelligence \u2014 Three studies, one connected perspective',
      description: 'Movement. Training. Injury consequences. Three independent studies, one evidence atlas.',
    },
    es: {
      title: 'Sports Rehab Intelligence \u2014 Tres estudios, una visión conectada',
      description: 'Un atlas de evidencia que reúne biomecánica, entrenamiento y consecuencias de la lesión. Tres estudios independientes, una línea de investigación reproducible.',
    },
  },
  evidence: {
    enPath: '/evidence.html',
    esPath: '/es/evidence.html',
    og: false,
    en: {
      title: 'Evidence and methods \u2014 Sports Rehab Intelligence',
      description: 'The question: which movement, training and injury-consequence dimensions are observed, and which data and validation are needed to connect them?',
    },
    es: {
      title: 'Evidencia y métodos \u2014 Sports Rehab Intelligence',
      description: 'Discusión, métodos, atribución y referencias primarias del atlas Sports Rehab Intelligence.',
    },
  },
};

export function looksSpanish(text) {
  return /[áéíóúüñ¿¡]/i.test(text || '') || SPANISH_WORD.test(text || '');
}

export function preferHtmlLanguage(source) {
  return source
    .replaceAll(
      "localStorage.getItem('runners-language')||'es'",
      "localStorage.getItem('runners-language')||((document.documentElement.lang||'en').startsWith('es')?'es':'en')",
    )
    .replaceAll(
      "localStorage.getItem('football-language') === 'en' ? 'en' : 'es'",
      "localStorage.getItem('football-language') === 'en' ? 'en' : ((document.documentElement.lang||'en').startsWith('es')?'es':'en')",
    );
}

function unescapeJs(value) {
  return value.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

export function extractPairs(js) {
  const pairs = new Map();
  if (!js) return pairs;
  for (const re of [
    /\bt\(\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'/g,
    /\bt\(\s*"((?:\\"|[^"])*)"\s*,\s*"((?:\\"|[^"])*)"/g,
  ]) {
    for (const match of js.matchAll(re)) pairs.set(unescapeJs(match[1]), unescapeJs(match[2]));
  }
  const title = js.match(/document\.title\s*=\s*(?:next\s*===\s*'es'\s*\?\s*)?'([^']*)'\s*:\s*'([^']*)'/);
  if (title) pairs.set(unescapeJs(title[1]), unescapeJs(title[2]));
  return pairs;
}

function sliceBalanced(source, openIndex) {
  const open = source[openIndex];
  const close = open === '{' ? '}' : open === '(' ? ')' : ']';
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = openIndex; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex, i + 1);
    }
  }
  throw new Error('Unbalanced JavaScript literal while reading study copy.');
}

export function loadCopyEs(source) {
  const marker = source.indexOf('const copy = ');
  if (marker < 0) return null;
  const brace = source.indexOf('{', marker);
  const literal = sliceBalanced(source, brace);
  const copy = Function(`"use strict"; return (${literal});`)();
  const tail = source.slice(brace + literal.length);
  const stop = tail.search(/\bcopy\.en\b|\bdocument\b/);
  const region = stop >= 0 ? tail.slice(0, stop) : tail;
  if (/\bcopy\.es\b|Object\.assign\(/.test(region)) Function('copy', `"use strict";\n${region}`)(copy);
  return copy?.es || null;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function plain(value) {
  return String(value || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function scanTag(html, index) {
  if (html.startsWith('<!--', index)) {
    const end = html.indexOf('-->', index);
    return { type: 'raw', end: end < 0 ? html.length : end + 3 };
  }
  if (html.startsWith('<!', index) || html.startsWith('<?', index)) {
    const end = html.indexOf('>', index);
    return { type: 'raw', end: end < 0 ? html.length : end + 1 };
  }
  if (html[index + 1] === '/') {
    const end = html.indexOf('>', index);
    const name = html.slice(index + 2, end < 0 ? html.length : end).trim().split(/\s/)[0].toLowerCase();
    return { type: 'close', name, end: end < 0 ? html.length : end + 1 };
  }
  let cursor = index + 1;
  while (cursor < html.length && /[A-Za-z0-9:-]/.test(html[cursor])) cursor += 1;
  const name = html.slice(index + 1, cursor).toLowerCase();
  let quote = null;
  for (; cursor < html.length; cursor += 1) {
    const char = html[cursor];
    if (quote) { if (char === quote) quote = null; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '>') { cursor += 1; break; }
  }
  const raw = html.slice(index, cursor);
  const selfClosing = /\/\s*>$/.test(raw) || VOID.has(name);
  return { type: selfClosing ? 'void' : 'start', name, raw, end: cursor };
}

function parseAttrs(raw) {
  const attrs = {};
  const body = raw.replace(/^<\/?[^\s>]+/, '').replace(/\/?>$/, '');
  const re = /([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = re.exec(body))) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  return attrs;
}

function elements(html) {
  const found = [];
  const stack = [];
  let index = 0;
  while (index < html.length) {
    if (html[index] !== '<') {
      const next = html.indexOf('<', index);
      index = next < 0 ? html.length : next;
      continue;
    }
    const tag = scanTag(html, index);
    if (tag.end <= index) { index += 1; continue; }
    if (tag.type === 'start' && (tag.name === 'script' || tag.name === 'style')) {
      const closeAt = html.toLowerCase().indexOf(`</${tag.name}`, tag.end);
      const end = closeAt < 0 ? html.length : html.indexOf('>', closeAt) + 1;
      found.push({ name: tag.name, attrs: parseAttrs(tag.raw), rawStart: tag.raw, start: index, innerStart: tag.end, innerEnd: closeAt < 0 ? html.length : closeAt, end });
      index = end;
      continue;
    }
    if (tag.type === 'start') {
      stack.push({ name: tag.name, attrs: parseAttrs(tag.raw), rawStart: tag.raw, start: index, innerStart: tag.end });
    } else if (tag.type === 'close') {
      for (let slot = stack.length - 1; slot >= 0; slot -= 1) {
        if (stack[slot].name !== tag.name) continue;
        const frame = stack[slot];
        stack.length = slot;
        found.push({ ...frame, innerEnd: index, end: tag.end, inner: html.slice(frame.innerStart, index) });
        break;
      }
    }
    index = tag.end;
  }
  return found;
}

function desiredText(attrs, lang) {
  const es = attrs['data-es'] ?? attrs['data-sri-es'];
  const en = attrs['data-en'] ?? attrs['data-sri-en'];
  if (es === undefined || en === undefined) return null;
  return lang === 'es' ? es : en;
}

function replaceInners(html, targets, textFor) {
  const leaves = targets.filter((el) => !targets.some((other) => other !== el && other.innerStart >= el.innerStart && other.innerEnd <= el.innerEnd && (other.innerStart !== el.innerStart || other.innerEnd !== el.innerEnd)));
  leaves.sort((a, b) => b.innerStart - a.innerStart);
  let out = html;
  for (const el of leaves) out = out.slice(0, el.innerStart) + textFor(el) + out.slice(el.innerEnd);
  return out;
}

function applyBilingual(html, lang) {
  const targets = elements(html).filter((el) => el.name !== 'script' && el.name !== 'style' && desiredText(el.attrs, lang) !== null);
  return replaceInners(html, targets, (el) => desiredText(el.attrs, lang));
}

function applyDictionary(html, dict, lang) {
  const map = dict?.[lang];
  if (!map) return html;
  const targets = elements(html).filter((el) => el.attrs['data-i18n'] && map[el.attrs['data-i18n']] !== undefined);
  return replaceInners(html, targets, (el) => map[el.attrs['data-i18n']]);
}

function setAttr(raw, name, value) {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`, 'i');
  const replacement = () => ` ${name}="${escapeAttr(value)}"`;
  if (re.test(raw)) return raw.replace(re, replacement);
  return raw.replace(/\s*\/?>$/, (end) => `${replacement()}${end}`);
}

function replaceStarts(html, targets, nextRaw) {
  const ordered = [...targets].sort((a, b) => b.start - a.start);
  let out = html;
  for (const el of ordered) {
    const raw = nextRaw(el);
    if (raw && raw !== el.rawStart) out = out.slice(0, el.start) + raw + out.slice(el.innerStart);
  }
  return out;
}

function applyAria(html, dict, lang) {
  const map = dict?.[lang];
  if (!map) return html;
  const targets = elements(html).filter((el) => el.attrs['data-i18n-aria'] && map[el.attrs['data-i18n-aria']]);
  return replaceStarts(html, targets, (el) => setAttr(el.rawStart, 'aria-label', map[el.attrs['data-i18n-aria']]));
}

function withHidden(raw, hide) {
  const has = /\shidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?(?=\s|\/?>)/i.test(raw);
  if (hide && !has) return raw.replace(/\s*\/?>$/, (end) => ` hidden${end}`);
  if (!hide && has) return raw.replace(/\s+hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?(?=\s|\/?>)/gi, '');
  return raw;
}

function applyVisibility(html, lang) {
  const targets = elements(html).filter((el) => el.attrs['data-content-lang'] === 'en' || el.attrs['data-content-lang'] === 'es');
  return replaceStarts(html, targets, (el) => withHidden(el.rawStart, el.attrs['data-content-lang'] !== lang));
}

function headOf(html) {
  const end = html.toLowerCase().indexOf('</head>');
  return end < 0 ? html : html.slice(0, end);
}

function readTitle(html) {
  const match = headOf(html).match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : '';
}

function readMeta(html, name, property) {
  const re = /<meta\b[^>]*>/gi;
  let match;
  const head = headOf(html);
  while ((match = re.exec(head))) {
    const attrs = parseAttrs(match[0]);
    if (name && (attrs.name || '').toLowerCase() === name) return attrs.content || '';
    if (property && (attrs.property || '').toLowerCase() === property) return attrs.content || '';
  }
  return '';
}

function bilingualLeaves(scope, lang) {
  const key = lang === 'es' ? 'data-es' : 'data-en';
  const all = elements(scope).filter((el) => el.attrs[key]);
  return all
    .filter((el) => !all.some((other) => other !== el && other.start >= el.start && other.end <= el.end && other !== el && (other.start !== el.start || other.end !== el.end)))
    .sort((a, b) => a.start - b.start)
    .map((el) => plain(el.attrs[key]))
    .filter(Boolean);
}

function headline(html, lang) {
  const h1 = elements(html).find((el) => el.name === 'h1');
  if (!h1) return '';
  const key = lang === 'es' ? 'data-es' : 'data-en';
  if (h1.attrs[key]) return plain(h1.attrs[key]);
  return bilingualLeaves(h1.inner, lang).join(' ');
}

function blurb(html, lang) {
  const key = lang === 'es' ? 'data-es' : 'data-en';
  const candidates = elements(html).filter((el) => el.attrs[key] && plain(el.attrs[key]).length >= 80);
  const preferred = candidates.find((el) => /(?:^|\s)(?:lede|hero-intro|hero-description)(?:\s|$)/.test(el.attrs.class || ''));
  const pick = preferred || candidates.find((el) => el.name === 'p') || candidates[0];
  return pick ? plain(pick.attrs[key]) : '';
}

function applyLongPairs(text, pairs) {
  let out = text;
  const entries = [...pairs.entries()].filter(([es, en]) => es.length >= 24 && es !== en).sort((a, b) => b[0].length - a[0].length);
  for (const [es, en] of entries) if (out.includes(es)) out = out.split(es).join(en);
  return out;
}

function choose(text, lang, pairs, fallback) {
  if (!text) return fallback[lang] || '';
  if (lang === 'en') {
    if (pairs.has(text)) return pairs.get(text);
    const replaced = applyLongPairs(text, pairs);
    if (!looksSpanish(replaced)) return replaced;
    return fallback.en || replaced;
  }
  for (const [es, en] of pairs) if (en === text) return es;
  if (looksSpanish(text)) return text;
  return fallback.es || text;
}

function composeTitle(title, headEn) {
  if (!headEn) return title;
  const brand = title.split(' · ')[0];
  if (brand && brand !== title && !looksSpanish(brand)) return `${brand} · ${headEn}`;
  return headEn;
}

function resolveStudySocial(html, lang, pairs, dict) {
  const hasOg = /property=(["'])og:(?:title|description)\1/i.test(headOf(html));
  const title = readTitle(html);
  const description = readMeta(html, 'description');
  const ogTitle = readMeta(html, '', 'og:title');
  const ogDescription = readMeta(html, '', 'og:description');
  const headEn = headline(html, 'en');
  const headEs = headline(html, 'es');
  const blurbEn = blurb(html, 'en');
  const blurbEs = blurb(html, 'es') || dict?.es?.heroLead || '';
  return {
    title: choose(title, lang, pairs, { en: composeTitle(title, headEn), es: headEs }),
    description: choose(description, lang, pairs, { en: blurbEn, es: blurbEs }),
    og: hasOg,
    ogTitle: choose(ogTitle || title, lang, pairs, { en: composeTitle(ogTitle || title, headEn), es: headEs }),
    ogDescription: choose(ogDescription || description, lang, pairs, { en: blurbEn, es: blurbEs }),
  };
}

function setDocumentTitle(html, title) {
  const end = html.toLowerCase().indexOf('</head>');
  const head = end < 0 ? html : html.slice(0, end);
  const rest = end < 0 ? '' : html.slice(end);
  const safe = escapeAttr(title).replace(/&quot;/g, '"');
  const next = /<title>[\s\S]*?<\/title>/i.test(head)
    ? head.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safe}</title>`)
    : head.replace(/<head\b[^>]*>/i, (match) => `${match}<title>${safe}</title>`);
  return next + rest;
}

function setMetaContent(html, { name, property }, content) {
  if (!content) return html;
  const attr = name ? 'name' : 'property';
  const key = (name || property).toLowerCase();
  const end = html.toLowerCase().indexOf('</head>');
  const head = end < 0 ? html : html.slice(0, end);
  const rest = end < 0 ? '' : html.slice(end);
  let found = false;
  const updated = head.replace(/<meta\b[^>]*>/gi, (tag) => {
    const attrs = parseAttrs(tag);
    if ((attrs[attr] || '').toLowerCase() !== key) return tag;
    found = true;
    const encoded = escapeAttr(content);
    if (/\scontent\s*=/.test(tag)) return tag.replace(/\scontent\s*=\s*(?:"[^"]*"|'[^']*')/i, () => ` content="${encoded}"`);
    return tag.replace(/\s*\/?>$/, () => ` content="${encoded}">`);
  });
  if (found) return updated + rest;
  return `${updated}<meta ${attr}="${name || property}" content="${escapeAttr(content)}">${rest}`;
}

function absolute(pathname) {
  if (!pathname || pathname === '/') return `${ORIGIN}/`;
  return `${ORIGIN}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function mapUrl(value, pageDir) {
  if (!value || value.startsWith('#') || value.startsWith('//') || /^(?:mailto|tel|data|javascript):/i.test(value)) return null;
  let origin = '';
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    if (!value.startsWith(ORIGIN)) return null;
    origin = ORIGIN;
    path = value.slice(ORIGIN.length) || '/';
  }
  let suffix = '';
  const hashAt = path.indexOf('#');
  if (hashAt >= 0) { suffix = path.slice(hashAt) + suffix; path = path.slice(0, hashAt); }
  const queryAt = path.indexOf('?');
  if (queryAt >= 0) { suffix = path.slice(queryAt) + suffix; path = path.slice(0, queryAt); }
  if (!path.startsWith('/')) {
    const base = pageDir.endsWith('/') ? pageDir : `${pageDir}/`;
    path = new URL(path, `https://local${base}`).pathname;
  }
  if (!ASSET.test(path)) {
    if (path === '/es' || path.startsWith('/es/')) return `${origin}${path}${suffix}`;
    path = path === '/' ? '/es/' : `/es${path}`;
  }
  return `${origin}${path}${suffix}`;
}

function rewriteUrls(html, pageDir) {
  let out = '';
  let index = 0;
  while (index < html.length) {
    if (html[index] !== '<') {
      const next = html.indexOf('<', index);
      if (next < 0) { out += html.slice(index); break; }
      out += html.slice(index, next);
      index = next;
      continue;
    }
    const tag = scanTag(html, index);
    if (tag.end <= index) { out += html[index]; index += 1; continue; }
    if (tag.type === 'start' || tag.type === 'void') {
      out += tag.raw.replace(/\s(href|src|poster)\s*=\s*("([^"]*)"|'([^']*)')/gi, (full, attr, quoted, doubleQuoted, singleQuoted) => {
        const value = doubleQuoted ?? singleQuoted;
        const quote = doubleQuoted !== undefined ? '"' : "'";
        const mapped = mapUrl(value, pageDir);
        return mapped && mapped !== value ? ` ${attr}=${quote}${mapped}${quote}` : full;
      });
    } else out += html.slice(index, tag.end);
    if (tag.type === 'start' && (tag.name === 'script' || tag.name === 'style')) {
      const closeAt = html.toLowerCase().indexOf(`</${tag.name}`, tag.end);
      const end = closeAt < 0 ? html.length : html.indexOf('>', closeAt) + 1;
      out += html.slice(tag.end, end);
      index = end;
      continue;
    }
    index = tag.end;
  }
  return out;
}

function applySwitch(html, href, label, text) {
  const targets = elements(html).filter((el) => el.attrs.id === 'language' || Object.hasOwn(el.attrs, 'data-sri-lang'));
  const ordered = [...targets].sort((a, b) => b.start - a.start);
  let out = html;
  for (const el of ordered) {
    let raw = el.rawStart;
    if (/^<button\b/i.test(raw)) raw = raw.replace(/^<button\b/i, '<a').replace(/\s+type\s*=\s*(?:"[^"]*"|'[^']*')/i, '');
    raw = setAttr(setAttr(raw, 'href', href), 'aria-label', label);
    const close = /^<a\b/i.test(raw) ? '</a>' : `</${el.name}>`;
    out = out.slice(0, el.start) + raw + text + close + out.slice(el.end);
  }
  return out;
}

function injectAlternates(html, lang, enPath, esPath) {
  const en = absolute(enPath);
  const es = absolute(esPath);
  const canonical = lang === 'es' ? es : en;
  const links = [
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="en" href="${en}">`,
    `<link rel="alternate" hreflang="es" href="${es}">`,
    `<link rel="alternate" hreflang="x-default" href="${en}">`,
  ].join('');
  const end = html.toLowerCase().indexOf('</head>');
  const head = end < 0 ? html : html.slice(0, end);
  const rest = end < 0 ? '' : html.slice(end);
  const stripped = head.replace(/<link\b[^>]*>/gi, (tag) => {
    const attrs = parseAttrs(tag);
    const rel = (attrs.rel || '').toLowerCase();
    if (rel === 'canonical' || (rel === 'alternate' && attrs.hreflang)) return '';
    return tag;
  });
  return `${stripped}${links}${rest}`;
}

function setHtmlLang(html, lang) {
  if (!/<html\b/i.test(html)) return `<html lang="${lang}">${html}</html>`;
  return html.replace(/<html\b([^>]*)>/i, (match, attrs) => {
    if (/\slang\s*=/.test(attrs)) return `<html${attrs.replace(/\slang\s*=\s*(["'])[^"']*\1/i, ` lang="${lang}"`)}>`;
    return `<html lang="${lang}"${attrs}>`;
  });
}

export function localizeDocument(html, options) {
  const lang = options.lang === 'es' ? 'es' : 'en';
  const pairs = options.pairs || new Map();
  const social = options.social === 'study' ? resolveStudySocial(html, lang, pairs, options.dict) : options.social;
  let out = setHtmlLang(html, lang);
  out = applyBilingual(out, lang);
  out = applyDictionary(out, options.dict, lang);
  out = applyAria(out, options.dict, lang);
  out = applyVisibility(out, lang);
  if (social?.title) out = setDocumentTitle(out, social.title);
  if (social?.description) out = setMetaContent(out, { name: 'description' }, social.description);
  if (social?.og) {
    out = setMetaContent(out, { property: 'og:title' }, social.ogTitle || social.title);
    out = setMetaContent(out, { property: 'og:description' }, social.ogDescription || social.description);
    out = setMetaContent(out, { property: 'og:locale' }, lang === 'es' ? 'es_ES' : 'en_US');
    out = setMetaContent(out, { property: 'og:url' }, absolute(lang === 'es' ? options.esPath : options.enPath));
  }
  if (lang === 'es') out = rewriteUrls(out, options.pageDir || '/');
  const href = lang === 'en' ? options.esPath : options.enPath;
  out = applySwitch(out, href, lang === 'en' ? 'Cambiar a español' : 'Switch to English', lang === 'en' ? 'ES' : 'EN');
  return injectAlternates(out, lang, options.enPath, options.esPath);
}

export function localizeAtlasHtml(html, lang, kind) {
  const spec = ATLAS[kind];
  const copy = spec[lang === 'es' ? 'es' : 'en'];
  return localizeDocument(html, {
    lang,
    enPath: spec.enPath,
    esPath: spec.esPath,
    pageDir: '/',
    social: { title: copy.title, description: copy.description, og: spec.og, ogTitle: copy.title, ogDescription: copy.description },
  });
}

export function studyPaths(route, relative) {
  const enPath = relative === 'index.html' ? `/${route}/` : `/${route}/${relative}`;
  return { enPath, esPath: `/es${enPath}`, pageDir: enPath.endsWith('/') ? enPath : enPath.slice(0, enPath.lastIndexOf('/') + 1) };
}

export async function writeAtlasLocales(siteDir) {
  for (const [file, kind] of [['index.html', 'home'], ['evidence.html', 'evidence']]) {
    const sourcePath = path.join(siteDir, file);
    const html = await readFile(sourcePath, 'utf8');
    await mkdir(path.join(siteDir, 'es'), { recursive: true });
    await writeFile(sourcePath, localizeAtlasHtml(html, 'en', kind));
    await writeFile(path.join(siteDir, 'es', file), localizeAtlasHtml(html, 'es', kind));
  }
}
