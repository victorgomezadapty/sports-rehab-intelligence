import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const web = fileURLToPath(new URL('../web/', import.meta.url));
const root = existsSync(dist) ? dist : web;
if (root === web) console.warn('Serving web/ because dist/ is missing. Run npm run build to mount the study routes.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.csv': 'text/csv; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.ipynb': 'application/json', '.zip': 'application/zip', '.png': 'image/png', '.bib': 'text/plain; charset=utf-8' };
const inside = (candidate) => {
  const base = root.endsWith(sep) ? root : root + sep;
  return candidate.startsWith(base);
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, `.${pathname}`);
    if (!inside(file) && file !== root.replace(/\/$/, '')) { res.writeHead(403); res.end(); return; }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = resolve(file, 'index.html');
    else if (!info && !extname(file)) {
      const html = `${file}.html`;
      if (inside(html) && await stat(html).then(() => true).catch(() => false)) file = html;
    }
    if (!inside(file)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 8778), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));
