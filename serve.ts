// Ember & Ladle — a tiny static server for play-testing the game locally.
// Serves game/ at http://localhost:8080, nothing else. Node 22, standard
// library only.
//
//   node serve.ts
//   open http://localhost:8080 in desktop Chrome
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join as joinPath, extname } from 'node:path';
import { fileURLToPath as pathFromUrl } from 'node:url';

const repoRoot = pathFromUrl(new URL('.', import.meta.url));
const gameDir = joinPath(repoRoot, 'game');
const port = Number(process.env.PORT ?? 8080);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const safe = joinPath(gameDir, rel);
  if (!safe.startsWith(gameDir)) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  try {
    const body = await readFile(safe);
    response.writeHead(200, { 'content-type': types[extname(safe)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Ember & Ladle at http://localhost:${port}`);
});
