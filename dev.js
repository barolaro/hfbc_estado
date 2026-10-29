// Servidor local de pruebas: sirve public/ y la API igual que Vercel.
// Uso: DATABASE_URL=... APP_SECRET=... node dev.js [puerto]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { manejar } from './lib/api.js';

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const RAIZ = new URL('./public', import.meta.url).pathname;

export function crearServidor() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      req.url = `/api/v1?r=${encodeURIComponent(url.pathname.slice(5))}`;
      return manejar(req, res);
    }
    let ruta = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (ruta === '/' || ruta === '\\') ruta = '/index.html';
    try {
      const datos = await readFile(join(RAIZ, ruta));
      res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
      res.end(datos);
    } catch {
      res.writeHead(404).end('No encontrado');
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const puerto = Number(process.argv[2]) || 3000;
  crearServidor().listen(puerto, () => console.log(`http://localhost:${puerto}`));
}
