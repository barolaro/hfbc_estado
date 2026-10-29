import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const N = 16384, R = 8, P = 1, LARGO = 64;

/* ---------- Claves ---------- */

export async function hashClave(clave) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(clave, sal, LARGO, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${hash.toString('base64')}`;
}

export async function verificarClave(clave, almacenado) {
  const [alg, n, r, p, sal, hash] = String(almacenado).split('$');
  if (alg !== 'scrypt') return false;
  const esperado = Buffer.from(hash, 'base64');
  const obtenido = await scryptAsync(clave, Buffer.from(sal, 'base64'), esperado.length,
    { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(esperado, obtenido);
}

// Se usa cuando el usuario no existe, para que la respuesta tarde lo mismo.
let falso;
export async function hashFalso() {
  falso ??= await hashClave(randomBytes(12).toString('hex'));
  return falso;
}

const COMUNES = new Set(['123456789012', 'password1234', 'contrasena123', 'qwertyuiop12', 'hospital12345', 'felixbulnes12']);

// Devuelve un texto con el problema o null si la clave es aceptable.
export function problemaClave(clave, usuario = '') {
  if (typeof clave !== 'string') return 'La clave debe ser texto.';
  if (clave.length < 12) return 'La clave debe tener al menos 12 caracteres.';
  if (clave.length > 128) return 'La clave no puede superar 128 caracteres.';
  if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(clave) || !/\d/.test(clave)) return 'La clave debe combinar letras y números.';
  if (usuario && clave.toLowerCase().includes(usuario.toLowerCase())) return 'La clave no puede contener el nombre de usuario.';
  if (COMUNES.has(clave.toLowerCase())) return 'Esa clave es demasiado común.';
  if (/^(.)\1+$/.test(clave)) return 'La clave no puede repetir un solo carácter.';
  return null;
}

// Clave temporal legible, sin caracteres ambiguos (0/O, 1/l/I).
export function claveTemporal() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const parte = () => Array.from({ length: 5 }, () => abc[randomInt(abc.length)]).join('');
  return `${parte()}-${parte()}-${parte()}${randomInt(10, 99)}`;
}

/* ---------- Sesiones ---------- */

export const nuevoToken = () => randomBytes(32).toString('base64url');
export const hashToken = token => createHash('sha256').update(token).digest('hex');

/* ---------- Cifrado de secretos (TOTP) ---------- */

function llave() {
  const base = process.env.APP_SECRET;
  if (!base || base.length < 32) throw new Error('APP_SECRET no está configurado (mínimo 32 caracteres).');
  return createHash('sha256').update(base).digest();
}

export function cifrar(texto) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', llave(), iv);
  const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), datos].map(b => b.toString('base64')).join('.');
}

export function descifrar(texto) {
  const [iv, tag, datos] = texto.split('.').map(s => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', llave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
}

/* ---------- TOTP (RFC 6238) ---------- */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function secretoTotp() {
  const bytes = randomBytes(20);
  let bits = '', out = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32ABuffer(s) {
  let bits = '';
  for (const ch of s.replace(/=+$/, '')) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function codigoTotp(secreto, contador) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(contador));
  const h = createHmac('sha1', base32ABuffer(secreto)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, '0');
}

// Acepta el paso actual y uno antes o después. Devuelve el contador válido o null.
// `ultimo` evita reutilizar un código ya usado.
export function verificarTotp(secreto, codigo, ultimo = 0, ahora = Date.now()) {
  if (!/^\d{6}$/.test(String(codigo))) return null;
  const actual = Math.floor(ahora / 30_000);
  for (const delta of [0, -1, 1]) {
    const c = actual + delta;
    if (c <= ultimo) continue;
    const esperado = Buffer.from(codigoTotp(secreto, c));
    if (timingSafeEqual(esperado, Buffer.from(String(codigo)))) return c;
  }
  return null;
}

export const uriTotp = (usuario, secreto) =>
  `otpauth://totp/${encodeURIComponent('HFBC Reposición VU')}:${encodeURIComponent(usuario)}` +
  `?secret=${secreto}&issuer=${encodeURIComponent('HFBC Reposición VU')}&algorithm=SHA1&digits=6&period=30`;
