#!/usr/bin/env node
// Serves compare.html or diagram.html (and the images they show) on 127.0.0.1, because
// playwright-cli blocks file:// URLs. Prints the page URL on the first line of stdout, then keeps
// serving until it is killed or --ttl seconds pass (default 600).
//
// Usage: node serve.mjs <page.html> [--ttl=<seconds>] key=value ... key@=<file to read as text>
// Values that are paths to existing image files are served under /f/<n>/<name> and replaced
// by that URL, so the page can load them.
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const page = args.shift();
if (!page || !existsSync(path.join(here, page))) {
  console.error('usage: node serve.mjs <compare.html|diagram.html> [--ttl=600] key=value ... key@=<file>');
  process.exit(1);
}

let ttl = 600;
const files = new Map();
const data = {};
for (const arg of args) {
  if (arg.startsWith('--ttl=')) { ttl = Number(arg.slice(6)) || ttl; continue; }
  const i = arg.indexOf('=');
  if (i < 1) continue;
  let key = arg.slice(0, i);
  let value = arg.slice(i + 1);
  if (key.endsWith('@')) {
    key = key.slice(0, -1);
    value = readFileSync(path.resolve(value), 'utf8');
  } else if (/\.(png|jpe?g|webp|gif)$/i.test(value) && existsSync(path.resolve(value))) {
    const route = `/f/${files.size}/${encodeURIComponent(path.basename(value))}`;
    files.set(route, path.resolve(value));
    value = route;
  }
  data[key] = value;
}

const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const file = url.pathname === `/${page}` ? path.join(here, page) : files.get(url.pathname);
  if (!file) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const hash = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  process.stdout.write(`http://127.0.0.1:${port}/${page}#${hash}\n`);
});
setTimeout(() => server.close(() => process.exit(0)), ttl * 1000).unref();
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
