// Language lives in the path. Query aliases and /en keep older links working.
export function redirectTarget(pathname, search = '') {
  const params = new URLSearchParams(String(search).replace(/^\?/, ''));
  const lang = params.get('lang');
  const onSpanish = pathname === '/es' || pathname.startsWith('/es/');
  const locationFor = (dest) => {
    params.delete('lang');
    const query = params.toString();
    return query ? `${dest}?${query}` : dest;
  };
  if (lang === 'es' && !onSpanish) {
    const dest = pathname === '/' ? '/es/' : `/es${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    return { status: 307, location: locationFor(dest) };
  }
  if (lang === 'en' && onSpanish) {
    const bare = pathname === '/es' || pathname === '/es/' ? '/' : (pathname.slice(3) || '/');
    return { status: 307, location: locationFor(bare.startsWith('/') ? bare : `/${bare}`) };
  }
  if (pathname === '/en' || pathname === '/en/') return { status: 308, location: '/' };
  if (pathname.startsWith('/en/')) return { status: 308, location: pathname.slice(3) || '/' };
  if (pathname === '/es') return { status: 308, location: locationFor('/es/') };
  return null;
}
