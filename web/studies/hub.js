const STUDY_KEYS = ['running-clinic-language', 'runners-language', 'football-language'];
const base = document.querySelector('meta[name="sri-study-base"]')?.content || '/';
const originalFetch = window.fetch.bind(window);
const onSpanish = () => location.pathname === '/es' || location.pathname.startsWith('/es/');
const toEnglishPath = (pathname) => pathname === '/es' || pathname === '/es/' ? '/' : pathname.startsWith('/es/') ? (pathname.slice(3) || '/') : (pathname || '/');
const toSpanishPath = (pathname) => { const bare = toEnglishPath(pathname); return bare === '/' ? '/es/' : `/es${bare.startsWith('/') ? bare : `/${bare}`}`; };

window.fetch = (input, init) => {
  if (typeof input === 'string') {
    if (input.startsWith('/') && !input.startsWith('//') && !input.startsWith('/studies/') && !input.startsWith('/es/')) input = base + input.slice(1);
    else if (onSpanish() && !input.startsWith('/') && !input.startsWith('#') && !/^[a-z]+:/i.test(input)) input = base + input.replace(/^\.\//, '');
  }
  return originalFetch(input, init);
};

const store = (lang) => {
  try {
    localStorage.setItem('sri-language', lang);
    for (const key of STUDY_KEYS) localStorage.setItem(key, lang);
  } catch {}
};

try {
  const stored = localStorage.getItem('sri-language');
  if (!onSpanish() && stored === 'es') {
    for (const key of STUDY_KEYS) localStorage.setItem(key, 'en');
    location.replace(toSpanishPath(location.pathname) + location.hash);
  } else {
    const paint = onSpanish() ? 'es' : 'en';
    for (const key of STUDY_KEYS) localStorage.setItem(key, paint);
    if (!onSpanish() && stored !== 'en' && stored !== 'es') localStorage.setItem('sri-language', 'en');
  }
} catch {}

const currentLanguage = () => (document.documentElement.lang || 'en').startsWith('es') ? 'es' : 'en';

function paintHub() {
  const lang = currentLanguage();
  document.querySelectorAll('[data-sri-es]').forEach((element) => {
    element.textContent = lang === 'en' ? element.dataset.sriEn : element.dataset.sriEs;
  });
  const button = document.querySelector('[data-sri-lang]');
  if (!button) return;
  button.textContent = lang === 'es' ? 'EN' : 'ES';
  button.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
}

function placeHub() {
  const hub = document.querySelector('.sri-hub');
  if (hub) document.documentElement.style.setProperty('--sri-hub-offset', `${hub.offsetHeight}px`);
}

function wireHub() {
  paintHub();
  placeHub();
  document.querySelector('[data-sri-lang]')?.addEventListener('click', () => {
    store(currentLanguage() === 'en' ? 'es' : 'en');
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest?.('.language-toggle, #lang, [data-lang]');
    if (!control || control.closest('.sri-hub')) return;
    const picked = control.dataset?.lang;
    const next = picked === 'en' || picked === 'es' ? picked : (currentLanguage() === 'en' ? 'es' : 'en');
    const target = (next === 'es' ? toSpanishPath(location.pathname) : toEnglishPath(location.pathname)) + location.hash;
    if (location.pathname === target.split('#')[0]) return;
    store(next);
    event.preventDefault();
    event.stopPropagation();
    location.href = target;
  }, true);
  window.addEventListener('resize', placeHub);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireHub);
else wireHub();
new MutationObserver(() => { paintHub(); placeHub(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
