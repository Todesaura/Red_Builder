import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.argv[2] || 8080);
const basePath = process.argv[3] || '/';
if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('Der Basispfad muss mit / beginnen und enden.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.ttf': 'font/ttf' };
createServer(async (request, response) => {
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!requestedPath.startsWith(basePath)) {
      response.writeHead(404).end('Nicht gefunden');
      return;
    }
    const pathname = `/${requestedPath.slice(basePath.length)}`;
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`) || pathname.split('/').some(part => part.startsWith('.'))) {
      response.writeHead(403).end('Zugriff verweigert');
      return;
    }
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(data);
  } catch {
    response.writeHead(404).end('Nicht gefunden');
  }
}).listen(port, '127.0.0.1', () => console.log(`RED//BUILDER: http://127.0.0.1:${port}${basePath}`));
