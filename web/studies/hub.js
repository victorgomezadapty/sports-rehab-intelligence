const STUDY_KEYS = ['running-clinic-language', 'runners-language', 'football-language'];
const base = document.querySelector('meta[name="sri-study-base"]')?.content || '/';
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith('/') && !input.startsWith('//') && !input.startsWith('/studies/')) {
    input = base + input.slice(1);
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
  const shared = localStorage.getItem('sri-language') === 'en' ? 'en' : 'es';
  for (const key of STUDY_KEYS) localStorage.setItem(key, shared);
} catch {}

const currentLanguage = () => (document.documentElement.lang || 'es').startsWith('en') ? 'en' : 'es';

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
    const next = currentLanguage() === 'en' ? 'es' : 'en';
    store(next);
    const explicit = document.querySelector(`.languages [data-lang="${next}"]`);
    const toggle = document.querySelector('.language-toggle, #lang');
    if (explicit) explicit.click();
    else if (toggle) toggle.click();
    else document.documentElement.lang = next;
    paintHub();
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest?.('.language-toggle, #lang, [data-lang]');
    if (!control || control.closest('.sri-hub')) return;
    setTimeout(() => { store(currentLanguage()); paintHub(); }, 0);
  });
  window.addEventListener('resize', placeHub);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireHub);
else wireHub();
new MutationObserver(() => { store(currentLanguage()); paintHub(); placeHub(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
