import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearServidor } from '../dev.js';
import { codigoTotp, hashClave } from '../lib/seguridad.js';
import { db } from '../lib/db.js';

// Requiere DATABASE_URL apuntando a una base de pruebas VACÍA.
process.env.APP_SECRET ||= 'x'.repeat(40);
const CLAVE_ADMIN = 'Temporal-2026-xyz';
process.env.ADMIN_INICIAL_USUARIO = 'admin';
process.env.ADMIN_INICIAL_HASH = await hashClave(CLAVE_ADMIN);

let servidor, base;
const sesiones = new Map();

async function llamar(quien, metodo, ruta, cuerpo, extra = {}) {
  const headers = { 'x-solicitud': 'tablero', ...extra.headers };
  if (cuerpo !== undefined) headers['content-type'] = 'application/json';
  if (sesiones.get(quien)) headers.cookie = sesiones.get(quien);
  const r = await fetch(base + '/api' + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const sc = r.headers.get('set-cookie');
  if (sc) sesiones.set(quien, sc.split(';')[0]);
  return { estado: r.status, datos: await r.json().catch(() => null), headers: r.headers };
}

const ingresar = async (quien, usuario, clave, codigo) => llamar(quien, 'POST', '/login', { usuario, clave, codigo });

before(async () => {
  servidor = crearServidor().listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
after(async () => { servidor.close(); await db().end(); });

describe('autenticación', () => {
  test('sin sesión no se accede a los datos', async () => {
    for (const ruta of ['/equipos', '/seguimiento', '/usuarios', '/auditoria', '/respaldo']) {
      assert.equal((await llamar('anon', 'GET', ruta)).estado, 401, ruta);
    }
  });

  test('exige la cabecera anti-CSRF y rechaza otro origen', async () => {
    const r = await fetch(base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(r.status, 403);
    const o = await fetch(base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-solicitud': 'tablero', origin: 'https://malo.example' }, body: '{}' });
    assert.equal(o.status, 403);
  });

  test('clave incorrecta y usuario inexistente dan el mismo mensaje', async () => {
    const a = await ingresar('x', 'admin', 'incorrecta-123');
    const b = await ingresar('x', 'nadie', 'incorrecta-123');
    assert.equal(a.estado, 401); assert.equal(b.estado, 401);
    assert.equal(a.datos.error, b.datos.error);
  });

  test('la cookie es HttpOnly y SameSite=Strict', async () => {
    const r = await ingresar('admin', 'admin', CLAVE_ADMIN);
    assert.equal(r.estado, 200);
    assert.equal(r.datos.usuario.debeCambiarClave, true);
    const c = r.headers.get('set-cookie');
    assert.match(c, /HttpOnly/); assert.match(c, /SameSite=Strict/);
  });

  test('con clave temporal solo puede cambiarla', async () => {
    const r = await llamar('admin', 'GET', '/equipos');
    assert.equal(r.estado, 403); assert.equal(r.datos.debeCambiarClave, true);
    const mala = await llamar('admin', 'POST', '/cuenta/clave', { actual: CLAVE_ADMIN, nueva: 'corta1' });
    assert.equal(mala.estado, 400);
    const ok = await llamar('admin', 'POST', '/cuenta/clave', { actual: CLAVE_ADMIN, nueva: 'Nueva-Clave-Segura-77' });
    assert.equal(ok.estado, 200);
    assert.equal((await llamar('admin', 'GET', '/equipos')).estado, 200);
  });

  test('bloquea tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) await ingresar('b', 'bloqueado', 'mala-clave-1234');
    const r = await ingresar('b', 'bloqueado', 'mala-clave-1234');
    assert.equal(r.estado, 429);
  });
});

describe('roles y datos', () => {
  let editor, lector;
  test('el administrador crea usuarios con clave temporal', async () => {
    const e = await llamar('admin', 'POST', '/usuarios', { usuario: 'editora', nombre: 'Editora Prueba', rol: 'editor' });
    const l = await llamar('admin', 'POST', '/usuarios', { usuario: 'lector1', nombre: 'Lector Prueba', rol: 'lector' });
    assert.equal(e.estado, 200); assert.ok(e.datos.claveTemporal);
    editor = e.datos.claveTemporal; lector = l.datos.claveTemporal;
    assert.equal((await llamar('admin', 'POST', '/usuarios', { usuario: 'editora', nombre: 'X', rol: 'editor' })).estado, 409);
    assert.equal((await llamar('admin', 'POST', '/usuarios', { usuario: 'Mal Nombre!', nombre: 'X', rol: 'editor' })).estado, 400);
  });

  test('cada rol solo hace lo que le corresponde', async () => {
    for (const [q, u, c] of [['ed', 'editora', editor], ['lec', 'lector1', lector]]) {
      await ingresar(q, u, c);
      assert.equal((await llamar(q, 'POST', '/cuenta/clave', { actual: c, nueva: `Definitiva-Segura-${q}-9` })).estado, 200);
    }
    assert.equal((await llamar('lec', 'GET', '/equipos')).datos.equipos.length, 117);
    assert.equal((await llamar('lec', 'PUT', '/seguimiento/10010', { version: 0, campos: { estado: 'En conciliación' } })).estado, 403);
    assert.equal((await llamar('lec', 'POST', '/equipos', { codigo: 5, equipo: 'X' })).estado, 403);
    assert.equal((await llamar('lec', 'GET', '/usuarios')).estado, 403);
    assert.equal((await llamar('ed', 'GET', '/usuarios')).estado, 403);
    assert.equal((await llamar('ed', 'GET', '/respaldo')).estado, 403);
    assert.equal((await llamar('ed', 'DELETE', '/equipos/10010')).estado, 403);
  });

  test('el editor guarda seguimiento y detecta conflictos de versión', async () => {
    const a = await llamar('ed', 'PUT', '/seguimiento/10010', { version: 0, campos: { estado: 'En conciliación', responsable: 'Hospital', fecha: '2026-11-30', accion: 'Pedir respaldo' } });
    assert.equal(a.estado, 200); assert.equal(a.datos.registro.version, 1);
    const choque = await llamar('ed', 'PUT', '/seguimiento/10010', { version: 0, campos: { estado: 'En ejecución' } });
    assert.equal(choque.estado, 409); assert.equal(choque.datos.actual.estado, 'En conciliación');
    const b = await llamar('ed', 'PUT', '/seguimiento/10010', { version: 1, campos: { estado: 'En revisión CTAR' } });
    assert.equal(b.datos.registro.version, 2); assert.equal(b.datos.registro.historial.length, 2);
    assert.equal(b.datos.registro.actualizadoPor, 'editora');
  });

  test('rechaza datos inválidos', async () => {
    assert.equal((await llamar('ed', 'PUT', '/seguimiento/10010', { version: 2, campos: { estado: 'Inventado' } })).estado, 400);
    assert.equal((await llamar('ed', 'PUT', '/seguimiento/10010', { version: 2, campos: { rol: 'admin' } })).estado, 400);
    assert.equal((await llamar('ed', 'PUT', '/seguimiento/999999', { version: 0, campos: { estado: 'Sin iniciar' } })).estado, 404);
    assert.equal((await llamar('ed', 'POST', '/equipos', { codigo: 'abc', equipo: 'X' })).estado, 400);
    assert.equal((await llamar('ed', 'POST', '/equipos', { codigo: 1, equipo: 'X', resultado: 'No existe' })).estado, 400);
    assert.equal((await llamar('ed', 'POST', '/equipos', { codigo: 1, equipo: 'X', campoRaro: 1 })).estado, 400);
  });

  test('el editor carga y modifica equipos; el admin los elimina', async () => {
    const c = await llamar('ed', 'POST', '/equipos', { codigo: 99001, equipo: 'Monitor de prueba', resultado: 'Solo registro Hospital', hospital: 3, plan: null });
    assert.equal(c.estado, 200); assert.equal(c.datos.equipo.hospital, 3);
    assert.equal((await llamar('ed', 'POST', '/equipos', { codigo: 99001, equipo: 'Repetido' })).estado, 409);
    const m = await llamar('ed', 'PUT', '/equipos/99001', { version: 1, hospital: 4 });
    assert.equal(m.datos.equipo.version, 2);
    assert.equal((await llamar('ed', 'PUT', '/equipos/99001', { version: 1, hospital: 9 })).estado, 409);
    assert.equal((await llamar('admin', 'DELETE', '/equipos/99001')).estado, 200);
    assert.equal((await llamar('lec', 'GET', '/equipos')).datos.equipos.length, 117);
  });

  test('los datos persisten y se ven entre usuarios', async () => {
    const s = (await llamar('lec', 'GET', '/seguimiento')).datos.registros;
    assert.equal(s[10010].estado, 'En revisión CTAR');
  });

  test('el administrador no puede quedarse sin acceso', async () => {
    const me = (await llamar('admin', 'GET', '/me')).datos.usuario;
    assert.equal((await llamar('admin', 'PUT', `/usuarios/${me.id}`, { activo: false })).estado, 400);
    assert.equal((await llamar('admin', 'PUT', `/usuarios/${me.id}`, { rol: 'lector' })).estado, 400);
  });

  test('desactivar a un usuario cierra su sesión', async () => {
    const lista = (await llamar('admin', 'GET', '/usuarios')).datos.usuarios;
    const l = lista.find(u => u.usuario === 'lector1');
    await llamar('admin', 'PUT', `/usuarios/${l.id}`, { activo: false });
    assert.equal((await llamar('lec', 'GET', '/equipos')).estado, 401);
    assert.equal((await ingresar('lec2', 'lector1', 'Definitiva-Segura-lec-9')).estado, 401);
  });

  test('reiniciar clave obliga a cambiarla y revoca sesiones', async () => {
    const lista = (await llamar('admin', 'GET', '/usuarios')).datos.usuarios;
    const e = lista.find(u => u.usuario === 'editora');
    const r = await llamar('admin', 'POST', `/usuarios/${e.id}/reiniciar`, {});
    assert.ok(r.datos.claveTemporal);
    assert.equal((await llamar('ed', 'GET', '/equipos')).estado, 401);
    const i = await ingresar('ed', 'editora', r.datos.claveTemporal);
    assert.equal(i.datos.usuario.debeCambiarClave, true);
  });
});

describe('segundo factor y auditoría', () => {
  test('TOTP: activación, exigencia y no reutilización del código', async () => {
    const ini = await llamar('admin', 'POST', '/cuenta/2fa/iniciar', {});
    assert.match(ini.datos.qr, /^data:image\/png/);
    const secreto = ini.datos.secreto;
    const cod = () => codigoTotp(secreto, Math.floor(Date.now() / 30000));
    assert.equal((await llamar('admin', 'POST', '/cuenta/2fa/activar', { codigo: '000000' })).estado, 400);
    assert.equal((await llamar('admin', 'POST', '/cuenta/2fa/activar', { codigo: cod() })).estado, 200);

    const sin = await ingresar('t', 'admin', 'Nueva-Clave-Segura-77');
    assert.equal(sin.estado, 401); assert.equal(sin.datos.requiereCodigo, true);
    const reuso = await ingresar('t', 'admin', 'Nueva-Clave-Segura-77', cod());
    assert.equal(reuso.estado, 401, 'el código ya usado al activar no sirve de nuevo');
    const futuro = codigoTotp(secreto, Math.floor(Date.now() / 30000) + 1);
    assert.equal((await ingresar('t', 'admin', 'Nueva-Clave-Segura-77', futuro)).estado, 200);
  });

  test('la auditoría registra quién hizo qué, sin claves', async () => {
    const ev = (await llamar('admin', 'GET', '/auditoria?limite=500')).datos.eventos;
    const acciones = new Set(ev.map(e => e.accion));
    for (const a of ['login', 'login_fallido', 'login_bloqueado', 'usuario_creado', 'seguimiento_guardado', 'equipo_creado', 'equipo_eliminado', 'acceso_denegado', 'clave_cambiada']) {
      assert.ok(acciones.has(a), `falta ${a}`);
    }
    assert.ok(!JSON.stringify(ev).includes('Nueva-Clave-Segura'));
  });

  test('el respaldo incluye todo y no incluye claves', async () => {
    const r = await llamar('admin', 'GET', '/respaldo');
    assert.equal(r.estado, 200);
    assert.ok(r.datos.equipos.length >= 117);
    assert.ok(!JSON.stringify(r.datos).includes('scrypt$'));
  });
});
