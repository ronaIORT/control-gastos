const { readFileSync, writeFileSync, readdirSync, statSync, existsSync } = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (!existsSync(distDir)) {
  console.error('[SW] ERROR: dist/ no encontrado. Ejecuta "vite build" primero.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const version = pkg.version;
const cacheName = `control-gastos-v${version}`;

function scanFiles(dir, basePath) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = basePath ? `${basePath}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      files.push(...scanFiles(full, rel));
    } else if (rel !== 'service-worker.js') {
      files.push(`./${rel}`);
    }
  }
  return files;
}

const precache = scanFiles(distDir, '').map(f => f.replace(/\\/g, '/'));

const swCode = [
  'const CACHE_NAME = ' + JSON.stringify(cacheName) + ';',
  '',
  'const PRECACHE = ' + JSON.stringify(precache, null, 2) + ';',
  '',
  'const APP_VERSION = CACHE_NAME.replace("control-gastos-v", "");',
  '',
  'self.addEventListener("install", (event) => {',
  '  event.waitUntil(',
  '    caches.open(CACHE_NAME).then((cache) =>',
  '      Promise.allSettled(',
  '        PRECACHE.map((url) =>',
  '          cache.add(url).catch(() => {})',
  '        )',
  '      )',
  '    )',
  '  );',
  '});',
  '',
  'self.addEventListener("activate", (event) => {',
  '  event.waitUntil(',
  '    caches.keys().then((keys) =>',
  '      Promise.all(',
  '        keys',
  '          .filter((k) => k.startsWith("control-gastos-v") && k !== CACHE_NAME)',
  '          .map((k) => caches.delete(k))',
  '      )',
  '    )',
  '      .then(() => self.clients.claim())',
  '      .then(() =>',
  '        self.clients.matchAll().then((clients) => {',
  '          clients.forEach((client) => {',
  '            client.postMessage({ type: "VERSION", version: APP_VERSION });',
  '          });',
  '        })',
  '      )',
  '  );',
  '});',
  '',
  'self.addEventListener("message", (event) => {',
  '  if (event.data && event.data.type === "SKIP_WAITING") {',
  '    self.skipWaiting();',
  '  }',
  '  if (event.data && event.data.type === "GET_VERSION") {',
  '    event.source.postMessage({ type: "VERSION", version: APP_VERSION });',
  '  }',
  '});',
  '',
  'self.addEventListener("fetch", (event) => {',
  '  if (event.request.method !== "GET") return;',
  '  const url = new URL(event.request.url);',
  '  if (url.protocol !== "http:" && url.protocol !== "https:") return;',
  '',
  '  event.respondWith(',
  '    caches.match(event.request).then((cached) => {',
  '      if (cached) return cached;',
  '      return fetch(event.request)',
  '        .then((response) => {',
  '          if (response && response.status === 200 && response.type === "basic") {',
  '            const clone = response.clone();',
  '            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));',
  '          }',
  '          return response;',
  '        })',
  '        .catch(() => {',
  '          if (event.request.mode === "navigate") {',
  '            return caches.match("./index.html");',
  '          }',
  '          if (',
  '            event.request.destination === "script" ||',
  '            event.request.destination === "style"',
  '          ) {',
  '            return new Response("", {',
  '              status: 200,',
  '              headers: {',
  '                "Content-Type":',
  '                  event.request.destination === "script"',
  '                    ? "application/javascript"',
  '                    : "text/css"',
  '              }',
  '            });',
  '          }',
  '          return new Response("", { status: 200 });',
  '        });',
  '    })',
  '  );',
  '});',
  ''
].join('\n');

writeFileSync(path.join(distDir, 'service-worker.js'), swCode, 'utf-8');

console.log('[SW] Generado: dist/service-worker.js');
console.log('[SW] Cache: ' + cacheName);
console.log('[SW] Assets precacheados: ' + precache.length);
