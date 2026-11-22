// A tiny static server for game/ (Node 22, standard library only), so an
// entry can be played locally without a build step:
//   node serve.ts [--port 8080] [--host 127.0.0.1]
// It logs every request with its status and timing, answers /__health for
// smoke tests, sends the MIME types a browser game needs, and refuses any
// path outside game/. A development convenience, not a public web server.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const argv = process.argv.slice(2);

function flagValue(name, fallback) {
  const at = argv.indexOf(name);
  return at === -1 || at + 1 >= argv.length ? fallback : argv[at + 1];
}

function pickPort(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

const port = pickPort(flagValue('--port', '8080'));
const host = flagValue('--host', '127.0.0.1');

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json'],
  ['.bin', 'application/octet-stream'],
  ['.wasm', 'application/wasm'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function logLine(status, method, path, ms) {
  console.log(`${new Date().toISOString()} ${status} ${method} ${path} ${ms}ms`);
}

function serveFile(request, response) {
  const started = Date.now();
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname === '/__health') {
    const body = JSON.stringify({ ok: true, game: 'sunburst-city' });
    response.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
    response.end(body);
    logLine(200, request.method, '/__health', Date.now() - started);
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    logLine(400, request.method, url.pathname, Date.now() - started);
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    logLine(403, request.method, pathname, Date.now() - started);
    return;
  }
  let size;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    logLine(404, request.method, pathname, Date.now() - started);
    return;
  }
  response.writeHead(200, {
    'content-type': TYPES.get(extname(file).toLowerCase()) ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
  response.on('finish', () => logLine(200, request.method, pathname, Date.now() - started));
}

createServer(serveFile).listen(port, host, () => {
  console.log(`game/ is on http://${host}:${port}  (health: /__health)`);
});
