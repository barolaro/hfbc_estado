import QRCode from 'qrcode';
import { auditar, ErrorHttp, preparar, q, db } from './db.js';
import {
  CAMPOS_EQUIPO, ESTADOS, INTENTOS_IP, INTENTOS_USUARIO, PRIORIDADES, RESULTADOS, ROLES,
  SESION_INACTIVIDAD_MIN, SESION_MAX_HORAS, VENTANA_BLOQUEO_MIN,
} from './constantes.js';
import {
  claveTemporal, cifrar, descifrar, hashClave, hashFalso, hashToken, nuevoToken, problemaClave,
  secretoTotp, uriTotp, verificarClave, verificarTotp,
} from './seguridad.js';

const RANGO = { lector: 1, editor: 2, admin: 3 };
const produccion = () => Boolean(process.env.VERCEL) || process.env.COOKIES_SEGURAS === '1';
const NOMBRE_COOKIE = () => (produccion() ? '__Host-sid' : 'sid');

/* ---------- Utilidades de petición ---------- */

function ipDe(req) {
  const real = req.headers['x-real-ip'];
  if (real) return String(real).slice(0, 64);
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 64);
}

function leerCookies(req) {
  const out = {};
  for (const par of String(req.headers.cookie || '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0) out[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
  }
  return out;
}

async function leerCuerpo(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  const tipo = String(req.headers['content-type'] || '');
  const traeCuerpo = Number(req.headers['content-length'] || 0) > 0 || Boolean(req.headers['transfer-encoding']);
  if (!traeCuerpo) return {};
  if (!tipo.toLowerCase().startsWith('application/json')) throw new ErrorHttp(415, 'El contenido debe ser JSON.');
  let crudo;
  if (req.body !== undefined && req.body !== null && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) {
    crudo = JSON.stringify(req.body);
  } else if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    crudo = req.body.toString('utf8');
  } else {
    const trozos = [];
    let largo = 0;
    for await (const t of req) {
      largo += t.length;
      if (largo > 200_000) throw new ErrorHttp(413, 'La solicitud es demasiado grande.');
      trozos.push(t);
    }
    crudo = Buffer.concat(trozos).toString('utf8');
  }
  if (crudo.length > 200_000) throw new ErrorHttp(413, 'La solicitud es demasiado grande.');
  if (!crudo) return {};
  try {
    const cuerpo = JSON.parse(crudo);
    if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) throw new Error();
    return cuerpo;
  } catch {
    throw new ErrorHttp(400, 'El JSON enviado no es válido.');
  }
}

// Defensa contra CSRF además de SameSite=Strict: el origen debe ser el propio sitio.
function verificarOrigen(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return;
  const host = req.headers.host;
  const origen = req.headers.origin;
  if (origen) {
    let h;
    try { h = new URL(origen).host; } catch { throw new ErrorHttp(403, 'Origen no permitido.'); }
    if (h !== host) throw new ErrorHttp(403, 'Origen no permitido.');
  } else if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) {
    throw new ErrorHttp(403, 'Origen no permitido.');
  }
  if (req.headers['x-solicitud'] !== 'tablero') throw new ErrorHttp(403, 'Solicitud no válida.');
}

function cookieSesion(token, maxSegundos) {
  const partes = [`${NOMBRE_COOKIE()}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxSegundos}`];
  if (produccion()) partes.push('Secure');
  return partes.join('; ');
}

const txt = (v, max, nombre, { requerido = false } = {}) => {
  if (v === undefined || v === null || v === '') {
    if (requerido) throw new ErrorHttp(400, `Falta ${nombre}.`);
    return '';
  }
  if (typeof v !== 'string') throw new ErrorHttp(400, `${nombre} debe ser texto.`);
  const limpio = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (limpio.length > max) throw new ErrorHttp(400, `${nombre} supera los ${max} caracteres.`);
  if (requerido && !limpio) throw new ErrorHttp(400, `Falta ${nombre}.`);
  return limpio;
};

/* ---------- Sesión y bloqueo ---------- */

async function sesionDe(req) {
  const token = leerCookies(req)[NOMBRE_COOKIE()];
  if (!token || token.length > 200) return null;
  const { rows: [s] } = await q(
    `select s.id_hash, s.ultima, u.id, u.usuario, u.nombre, u.rol, u.debe_cambiar, u.totp_activo
       from sesiones s join usuarios u on u.id = s.usuario_id
      where s.id_hash = $1 and s.expira > now() and u.activo
        and s.ultima > now() - make_interval(mins => $2)`,
    [hashToken(token), SESION_INACTIVIDAD_MIN]);
  if (!s) return null;
  if (Date.now() - new Date(s.ultima).getTime() > 60_000) {
    q('update sesiones set ultima = now() where id_hash = $1', [s.id_hash]).catch(() => {});
  }
  return { id: s.id, usuario: s.usuario, nombre: s.nombre, rol: s.rol, debeCambiar: s.debe_cambiar, totp: s.totp_activo, idHash: s.id_hash };
}

const perfil = s => ({ id: s.id, usuario: s.usuario, nombre: s.nombre, rol: s.rol, debeCambiarClave: s.debeCambiar, totp: s.totp });

async function estaBloqueado(usuario, ip) {
  const { rows } = await q(
    `select clave, count(*)::int as n from intentos
      where clave = any($1) and ts > now() - make_interval(mins => $2) group by clave`,
    [[`u:${usuario}`, `ip:${ip}`], VENTANA_BLOQUEO_MIN]);
  const n = c => rows.find(r => r.clave === c)?.n || 0;
  return n(`u:${usuario}`) >= INTENTOS_USUARIO || n(`ip:${ip}`) >= INTENTOS_IP;
}

const registrarFallo = (usuario, ip) =>
  q('insert into intentos (clave) values ($1), ($2)', [`u:${usuario}`, `ip:${ip}`]);

async function crearSesion(res, usuarioId, req) {
  const token = nuevoToken();
  await q(
    `insert into sesiones (id_hash, usuario_id, expira, ip, ua)
     values ($1, $2, now() + make_interval(hours => $3), $4, $5)`,
    [hashToken(token), usuarioId, SESION_MAX_HORAS, ipDe(req), String(req.headers['user-agent'] || '').slice(0, 200)]);
  res.setHeader('Set-Cookie', cookieSesion(token, SESION_MAX_HORAS * 3600));
}

/* ---------- Validación de equipos ---------- */

function validarEquipo(entrada, { parcial = false } = {}) {
  const datos = {};
  for (const [campo, tipo] of Object.entries(CAMPOS_EQUIPO)) {
    if (!(campo in entrada)) continue;
    const v = entrada[campo];
    if (tipo === 'texto') datos[campo] = txt(v, 500, campo);
    else if (tipo === 'resultado') {
      if (!RESULTADOS.includes(v)) throw new ErrorHttp(400, 'El resultado del cruce no es válido.');
      datos[campo] = v;
    } else if (v === null || v === '') datos[campo] = null;
    else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 1e9) throw new ErrorHttp(400, `${campo} debe ser un número válido.`);
      datos[campo] = n;
    }
  }
  const desconocidos = Object.keys(entrada).filter(k => !(k in CAMPOS_EQUIPO) && !['codigo', 'version'].includes(k));
  if (desconocidos.length) throw new ErrorHttp(400, `Campos no permitidos: ${desconocidos.join(', ')}.`);
  if (!parcial && !datos.equipo) throw new ErrorHttp(400, 'Falta el nombre del equipo.');
  return datos;
}

const equipoSalida = f => ({ codigo: f.codigo, ...f.datos, version: f.version });

function entero(v, nombre) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 99_999_999) throw new ErrorHttp(400, `${nombre} no es válido.`);
  return n;
}

/* ---------- Rutas ---------- */

const rutas = [];
const ruta = (metodo, patron, rol, fn, opciones = {}) =>
  rutas.push({ metodo, re: new RegExp(`^${patron}$`), rol, fn, ...opciones });

// Sin sesión
ruta('GET', '/salud', null, async () => ({ ok: true }));

ruta('POST', '/login', null, async ({ req, res, ip, cuerpo }) => {
  const usuario = txt(cuerpo.usuario, 60, 'usuario', { requerido: true }).toLowerCase();
  const clave = typeof cuerpo.clave === 'string' ? cuerpo.clave : '';
  if (!clave || clave.length > 200) throw new ErrorHttp(400, 'Ingrese su clave.');

  if (await estaBloqueado(usuario, ip)) {
    await auditar(usuario, 'login_bloqueado', 'sesion', null, ip);
    throw new ErrorHttp(429, `Demasiados intentos fallidos. Espere ${VENTANA_BLOQUEO_MIN} minutos e intente de nuevo.`);
  }

  const { rows: [u] } = await q('select * from usuarios where usuario = $1', [usuario]);
  const valida = await verificarClave(clave, u ? u.clave_hash : await hashFalso());
  if (!u || !u.activo || !valida) {
    await registrarFallo(usuario, ip);
    await auditar(usuario, 'login_fallido', 'sesion', null, ip);
    throw new ErrorHttp(401, 'Usuario o clave incorrectos.');
  }

  if (u.totp_activo) {
    if (!cuerpo.codigo) throw new ErrorHttp(401, 'Ingrese el código de su aplicación de autenticación.', { requiereCodigo: true });
    const contador = verificarTotp(descifrar(u.totp_secreto), String(cuerpo.codigo).replace(/\s/g, ''), Number(u.totp_ultimo));
    if (contador === null) {
      await registrarFallo(usuario, ip);
      await auditar(usuario, 'login_codigo_invalido', 'sesion', null, ip);
      throw new ErrorHttp(401, 'El código no es válido o ya fue usado.', { requiereCodigo: true });
    }
    await q('update usuarios set totp_ultimo = $2 where id = $1', [u.id, contador]);
  }

  await q('delete from intentos where clave = $1', [`u:${usuario}`]);
  await q('delete from sesiones where usuario_id = $1 and expira < now()', [u.id]);
  await crearSesion(res, u.id, req);
  await q('update usuarios set ultimo_acceso = now() where id = $1', [u.id]);
  await auditar(usuario, 'login', 'sesion', null, ip);
  return { usuario: perfil({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, debeCambiar: u.debe_cambiar, totp: u.totp_activo }) };
});

ruta('POST', '/logout', null, async ({ res, ip, sesion }) => {
  if (sesion) {
    await q('delete from sesiones where id_hash = $1', [sesion.idHash]);
    await auditar(sesion.usuario, 'logout', 'sesion', null, ip);
  }
  res.setHeader('Set-Cookie', cookieSesion('', 0));
  return { ok: true };
});

ruta('GET', '/me', null, async ({ sesion }) => {
  if (!sesion) throw new ErrorHttp(401, 'Sesión no iniciada.');
  return { usuario: perfil(sesion) };
});

// Cuenta propia
ruta('POST', '/cuenta/clave', 'lector', async ({ sesion, cuerpo, ip, res }) => {
  const { rows: [u] } = await q('select clave_hash from usuarios where id = $1', [sesion.id]);
  if (!(await verificarClave(String(cuerpo.actual ?? ''), u.clave_hash))) {
    await registrarFallo(sesion.usuario, ip);
    throw new ErrorHttp(400, 'La clave actual no es correcta.');
  }
  const problema = problemaClave(cuerpo.nueva, sesion.usuario);
  if (problema) throw new ErrorHttp(400, problema);
  if (cuerpo.nueva === cuerpo.actual) throw new ErrorHttp(400, 'La clave nueva debe ser distinta de la actual.');
  await q('update usuarios set clave_hash = $2, debe_cambiar = false, clave_cambiada_en = now() where id = $1',
    [sesion.id, await hashClave(cuerpo.nueva)]);
  // Cierra las demás sesiones y mantiene esta.
  await q('delete from sesiones where usuario_id = $1 and id_hash <> $2', [sesion.id, sesion.idHash]);
  await auditar(sesion.usuario, 'clave_cambiada', 'usuarios', null, ip);
  return { ok: true };
}, { permitirCambioPendiente: true });

ruta('POST', '/cuenta/2fa/iniciar', 'lector', async ({ sesion }) => {
  const secreto = secretoTotp();
  await q('update usuarios set totp_secreto = $2, totp_activo = false, totp_ultimo = 0 where id = $1', [sesion.id, cifrar(secreto)]);
  const uri = uriTotp(sesion.usuario, secreto);
  return { secreto, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
});

ruta('POST', '/cuenta/2fa/activar', 'lector', async ({ sesion, cuerpo, ip }) => {
  const { rows: [u] } = await q('select totp_secreto, totp_ultimo from usuarios where id = $1', [sesion.id]);
  if (!u.totp_secreto) throw new ErrorHttp(400, 'Primero inicie la configuración.');
  const c = verificarTotp(descifrar(u.totp_secreto), String(cuerpo.codigo ?? '').replace(/\s/g, ''), Number(u.totp_ultimo));
  if (c === null) throw new ErrorHttp(400, 'El código no es válido. Revise la hora de su teléfono e intente de nuevo.');
  await q('update usuarios set totp_activo = true, totp_ultimo = $2 where id = $1', [sesion.id, c]);
  await auditar(sesion.usuario, '2fa_activado', 'usuarios', null, ip);
  return { ok: true };
});

ruta('POST', '/cuenta/2fa/desactivar', 'lector', async ({ sesion, cuerpo, ip }) => {
  const { rows: [u] } = await q('select clave_hash from usuarios where id = $1', [sesion.id]);
  if (!(await verificarClave(String(cuerpo.clave ?? ''), u.clave_hash))) throw new ErrorHttp(400, 'La clave no es correcta.');
  await q('update usuarios set totp_activo = false, totp_secreto = null where id = $1', [sesion.id]);
  await auditar(sesion.usuario, '2fa_desactivado', 'usuarios', null, ip);
  return { ok: true };
});

// Equipos
ruta('GET', '/equipos', 'lector', async () => {
  const { rows } = await q('select codigo, datos, version from equipos where not eliminado order by codigo');
  return { equipos: rows.map(equipoSalida) };
});

ruta('POST', '/equipos', 'editor', async ({ cuerpo, sesion, ip }) => {
  const codigo = entero(cuerpo.codigo, 'El código');
  const datos = validarEquipo(cuerpo);
  const { rows: [previo] } = await q('select eliminado from equipos where codigo = $1', [codigo]);
  if (previo && !previo.eliminado) throw new ErrorHttp(409, `Ya existe el equipo ${codigo}.`);
  const { rows: [f] } = await q(
    `insert into equipos (codigo, datos, actualizado_por) values ($1, $2, $3)
     on conflict (codigo) do update set datos = excluded.datos, eliminado = false,
       version = equipos.version + 1, actualizado_en = now(), actualizado_por = excluded.actualizado_por
     returning codigo, datos, version`, [codigo, datos, sesion.usuario]);
  await q('insert into equipos_historial (codigo, usuario, version, datos) values ($1,$2,$3,$4)', [codigo, sesion.usuario, f.version, datos]);
  await auditar(sesion.usuario, 'equipo_creado', `equipo:${codigo}`, { equipo: datos.equipo }, ip);
  return { equipo: equipoSalida(f) };
});

ruta('PUT', '/equipos/(\\d+)', 'editor', async ({ cuerpo, sesion, ip, params }) => {
  const codigo = entero(params[0], 'El código');
  const version = entero(cuerpo.version, 'La versión');
  const cambios = validarEquipo(cuerpo, { parcial: true });
  const { rows: [actual] } = await q('select datos, version from equipos where codigo = $1 and not eliminado', [codigo]);
  if (!actual) throw new ErrorHttp(404, 'El equipo no existe.');
  const datos = { ...actual.datos, ...cambios };
  const { rows: [f] } = await q(
    `update equipos set datos = $2, version = version + 1, actualizado_en = now(), actualizado_por = $3
      where codigo = $1 and version = $4 returning codigo, datos, version`, [codigo, datos, sesion.usuario, version]);
  if (!f) {
    const { rows: [cur] } = await q('select codigo, datos, version from equipos where codigo = $1', [codigo]);
    throw new ErrorHttp(409, 'Otra persona modificó este equipo mientras usted lo editaba. Se cargó la versión más reciente.', { actual: equipoSalida(cur) });
  }
  await q('insert into equipos_historial (codigo, usuario, version, datos) values ($1,$2,$3,$4)', [codigo, sesion.usuario, f.version, datos]);
  const cambiados = Object.keys(cambios).filter(k => JSON.stringify(cambios[k]) !== JSON.stringify(actual.datos[k]));
  await auditar(sesion.usuario, 'equipo_modificado', `equipo:${codigo}`, { campos: cambiados }, ip);
  return { equipo: equipoSalida(f) };
});

ruta('DELETE', '/equipos/(\\d+)', 'admin', async ({ sesion, ip, params }) => {
  const codigo = entero(params[0], 'El código');
  const { rowCount } = await q(
    'update equipos set eliminado = true, version = version + 1, actualizado_en = now(), actualizado_por = $2 where codigo = $1 and not eliminado',
    [codigo, sesion.usuario]);
  if (!rowCount) throw new ErrorHttp(404, 'El equipo no existe.');
  await auditar(sesion.usuario, 'equipo_eliminado', `equipo:${codigo}`, null, ip);
  return { ok: true };
});

// Seguimiento de gestión
async function seguimientoSalida(codigos) {
  const { rows } = await q(
    `select s.codigo, s.datos, s.version, s.actualizado_en, s.actualizado_por from seguimiento s
       join equipos e on e.codigo = s.codigo and not e.eliminado
      ${codigos ? 'where s.codigo = any($1)' : ''}`, codigos ? [codigos] : []);
  const { rows: hist } = await q(
    `select codigo, ts, usuario, estado, responsable, accion from (
       select *, row_number() over (partition by codigo order by ts desc, id desc) as rn from seguimiento_historial
        ${codigos ? 'where codigo = any($1)' : ''}) h where rn <= 8 order by codigo, ts desc`, codigos ? [codigos] : []);
  const porCodigo = {};
  for (const h of hist) (porCodigo[h.codigo] ??= []).push({ t: new Date(h.ts).getTime(), estado: h.estado, responsable: h.responsable, accion: h.accion, usuario: h.usuario });
  const out = {};
  for (const r of rows) {
    out[r.codigo] = { ...r.datos, version: r.version, actualizado: new Date(r.actualizado_en).getTime(),
      actualizadoPor: r.actualizado_por, historial: porCodigo[r.codigo] || [] };
  }
  return out;
}

ruta('GET', '/seguimiento', 'lector', async () => ({ registros: await seguimientoSalida() }));

ruta('PUT', '/seguimiento/(\\d+)', 'editor', async ({ cuerpo, sesion, ip, params }) => {
  const codigo = entero(params[0], 'El código');
  const version = Number(cuerpo.version ?? 0);
  if (!Number.isInteger(version) || version < 0) throw new ErrorHttp(400, 'La versión no es válida.');
  const { rows: [eq] } = await q('select 1 from equipos where codigo = $1 and not eliminado', [codigo]);
  if (!eq) throw new ErrorHttp(404, 'El equipo no existe.');

  const c = cuerpo.campos && typeof cuerpo.campos === 'object' ? cuerpo.campos : {};
  const permitidos = ['estado', 'prioridad', 'responsable', 'fecha', 'accion', 'nota'];
  const extra = Object.keys(c).filter(k => !permitidos.includes(k));
  if (extra.length) throw new ErrorHttp(400, `Campos no permitidos: ${extra.join(', ')}.`);
  if ('estado' in c && !ESTADOS.includes(c.estado)) throw new ErrorHttp(400, 'El estado de gestión no es válido.');
  if ('prioridad' in c && !PRIORIDADES.includes(c.prioridad)) throw new ErrorHttp(400, 'La prioridad no es válida.');
  if ('fecha' in c && c.fecha !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) throw new ErrorHttp(400, 'La fecha no es válida.');

  const cli = await db().connect();
  try {
    await cli.query('begin');
    const { rows: [previo] } = await cli.query('select datos, version from seguimiento where codigo = $1 for update', [codigo]);
    if ((previo?.version ?? 0) !== version) {
      await cli.query('rollback');
      const actual = (await seguimientoSalida([codigo]))[codigo] || null;
      throw new ErrorHttp(409, 'Otra persona actualizó este seguimiento mientras usted lo editaba. Se cargó la versión más reciente.', { actual });
    }
    const base = { estado: ESTADOS[0], responsable: '', fecha: '', prioridad: 'Media', accion: '', nota: '' };
    const nuevo = { ...base, ...(previo?.datos || {}) };
    for (const k of permitidos) if (k in c) nuevo[k] = ['estado', 'prioridad'].includes(k) ? c[k] : txt(c[k], k === 'fecha' ? 10 : 1500, k);
    const cambio = !previo || permitidos.some(k => (previo.datos[k] ?? '') !== (nuevo[k] ?? ''));
    if (!cambio) { await cli.query('rollback'); return { sinCambios: true, registro: (await seguimientoSalida([codigo]))[codigo] }; }
    await cli.query(
      `insert into seguimiento (codigo, datos, version, actualizado_por) values ($1,$2,1,$3)
       on conflict (codigo) do update set datos = excluded.datos, version = seguimiento.version + 1,
         actualizado_en = now(), actualizado_por = excluded.actualizado_por`, [codigo, nuevo, sesion.usuario]);
    await cli.query('insert into seguimiento_historial (codigo, usuario, estado, responsable, accion) values ($1,$2,$3,$4,$5)',
      [codigo, sesion.usuario, nuevo.estado, nuevo.responsable, nuevo.accion]);
    await cli.query(`insert into auditoria (usuario, accion, entidad, detalle, ip) values ($1,'seguimiento_guardado',$2,$3,$4)`,
      [sesion.usuario, `equipo:${codigo}`, { estado: nuevo.estado, responsable: nuevo.responsable }, ip]);
    await cli.query('commit');
  } catch (err) {
    await cli.query('rollback').catch(() => {});
    throw err;
  } finally {
    cli.release();
  }
  return { registro: (await seguimientoSalida([codigo]))[codigo] };
});

ruta('DELETE', '/seguimiento/(\\d+)', 'editor', async ({ sesion, ip, params }) => {
  const codigo = entero(params[0], 'El código');
  await q('delete from seguimiento where codigo = $1', [codigo]);
  await q(`insert into seguimiento_historial (codigo, usuario, estado, responsable, accion) values ($1,$2,'Seguimiento limpiado','','')`, [codigo, sesion.usuario]);
  await auditar(sesion.usuario, 'seguimiento_limpiado', `equipo:${codigo}`, null, ip);
  return { ok: true };
});

// Administración
const usuarioSalida = u => ({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, activo: u.activo,
  totp: u.totp_activo, debeCambiarClave: u.debe_cambiar, ultimoAcceso: u.ultimo_acceso, creado: u.creado_en });

ruta('GET', '/usuarios', 'admin', async () => {
  const { rows } = await q('select * from usuarios order by usuario');
  return { usuarios: rows.map(usuarioSalida) };
});

ruta('POST', '/usuarios', 'admin', async ({ cuerpo, sesion, ip }) => {
  const usuario = txt(cuerpo.usuario, 40, 'usuario', { requerido: true }).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(usuario)) throw new ErrorHttp(400, 'El usuario debe tener 3 a 40 caracteres: letras minúsculas, números, punto, guion o guion bajo.');
  const nombre = txt(cuerpo.nombre, 100, 'nombre', { requerido: true });
  if (!ROLES.includes(cuerpo.rol)) throw new ErrorHttp(400, 'El rol no es válido.');
  const temporal = claveTemporal();
  try {
    const { rows: [u] } = await q(
      `insert into usuarios (usuario, nombre, rol, clave_hash, debe_cambiar) values ($1,$2,$3,$4,true) returning *`,
      [usuario, nombre, cuerpo.rol, await hashClave(temporal)]);
    await auditar(sesion.usuario, 'usuario_creado', `usuario:${usuario}`, { rol: cuerpo.rol }, ip);
    return { usuario: usuarioSalida(u), claveTemporal: temporal };
  } catch (err) {
    if (err.code === '23505') throw new ErrorHttp(409, 'Ya existe un usuario con ese nombre.');
    throw err;
  }
});

async function ultimosAdmins(idExcluido) {
  const { rows: [{ n }] } = await q(`select count(*)::int as n from usuarios where rol = 'admin' and activo and id <> $1`, [idExcluido]);
  return n === 0;
}

ruta('PUT', '/usuarios/(\\d+)', 'admin', async ({ cuerpo, sesion, ip, params }) => {
  const id = entero(params[0], 'El usuario');
  const { rows: [u] } = await q('select * from usuarios where id = $1', [id]);
  if (!u) throw new ErrorHttp(404, 'El usuario no existe.');
  const rol = 'rol' in cuerpo ? cuerpo.rol : u.rol;
  const activo = 'activo' in cuerpo ? Boolean(cuerpo.activo) : u.activo;
  const nombre = 'nombre' in cuerpo ? txt(cuerpo.nombre, 100, 'nombre', { requerido: true }) : u.nombre;
  if (!ROLES.includes(rol)) throw new ErrorHttp(400, 'El rol no es válido.');
  if ((rol !== 'admin' || !activo) && u.rol === 'admin' && u.activo && await ultimosAdmins(id)) {
    throw new ErrorHttp(400, 'Debe quedar al menos una persona administradora activa.');
  }
  if (id === sesion.id && (!activo || rol !== u.rol)) throw new ErrorHttp(400, 'No puede cambiar su propio rol ni desactivarse.');
  const { rows: [n] } = await q('update usuarios set rol = $2, activo = $3, nombre = $4 where id = $1 returning *', [id, rol, activo, nombre]);
  if (!activo || rol !== u.rol) await q('delete from sesiones where usuario_id = $1', [id]);
  await auditar(sesion.usuario, 'usuario_modificado', `usuario:${u.usuario}`, { rol, activo }, ip);
  return { usuario: usuarioSalida(n) };
});

ruta('POST', '/usuarios/(\\d+)/reiniciar', 'admin', async ({ cuerpo, sesion, ip, params }) => {
  const id = entero(params[0], 'El usuario');
  const { rows: [u] } = await q('select usuario from usuarios where id = $1', [id]);
  if (!u) throw new ErrorHttp(404, 'El usuario no existe.');
  if (id === sesion.id) throw new ErrorHttp(400, 'Cambie su propia clave desde Mi cuenta.');
  const temporal = claveTemporal();
  await q(`update usuarios set clave_hash = $2, debe_cambiar = true, clave_cambiada_en = null
            ${cuerpo.quitar2fa ? ', totp_activo = false, totp_secreto = null' : ''} where id = $1`, [id, await hashClave(temporal)]);
  await q('delete from sesiones where usuario_id = $1', [id]);
  await q('delete from intentos where clave = $1', [`u:${u.usuario}`]);
  await auditar(sesion.usuario, 'clave_reiniciada', `usuario:${u.usuario}`, { quito2fa: Boolean(cuerpo.quitar2fa) }, ip);
  return { claveTemporal: temporal };
});

ruta('GET', '/auditoria', 'admin', async ({ query }) => {
  const limite = Math.min(Math.max(Number(query.get('limite')) || 100, 1), 500);
  const { rows } = await q('select id, ts, usuario, accion, entidad, detalle, ip from auditoria order by id desc limit $1', [limite]);
  return { eventos: rows };
});

ruta('GET', '/respaldo', 'admin', async ({ sesion, ip }) => {
  const [equipos, seguimiento, historial, usuarios] = await Promise.all([
    q('select codigo, datos, version, eliminado, actualizado_en, actualizado_por from equipos order by codigo'),
    q('select codigo, datos, version, actualizado_en, actualizado_por from seguimiento order by codigo'),
    q('select codigo, ts, usuario, estado, responsable, accion from seguimiento_historial order by id'),
    q('select usuario, nombre, rol, activo from usuarios order by usuario'),
  ]);
  await auditar(sesion.usuario, 'respaldo_descargado', null, null, ip);
  return { version: 3, generado: new Date().toISOString(), equipos: equipos.rows, seguimiento: seguimiento.rows,
    historialSeguimiento: historial.rows, usuarios: usuarios.rows };
}, { descarga: 'respaldo_tablero_vu_hfbc.json' });

/* ---------- Despachador ---------- */

function responder(res, estado, cuerpo) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(cuerpo));
}

export async function manejar(req, res) {
  try {
    const url = new URL(req.url, 'http://x');
    const sub = '/' + (url.searchParams.get('r') || '').replace(/^\/+|\/+$/g, '');
    const metodo = req.method === 'HEAD' ? 'GET' : req.method;

    const coincidencias = rutas.filter(r => r.re.test(sub));
    if (!coincidencias.length) return responder(res, 404, { error: 'No encontrado.' });
    const r = coincidencias.find(x => x.metodo === metodo);
    if (!r) {
      res.setHeader('Allow', coincidencias.map(x => x.metodo).join(', '));
      return responder(res, 405, { error: 'Método no permitido.' });
    }

    verificarOrigen(req);
    await preparar();
    const ip = ipDe(req);
    const sesion = await sesionDe(req);

    if (r.rol) {
      if (!sesion) throw new ErrorHttp(401, 'Su sesión expiró. Ingrese nuevamente.');
      if (sesion.debeCambiar && !r.permitirCambioPendiente) throw new ErrorHttp(403, 'Debe cambiar su clave temporal antes de continuar.', { debeCambiarClave: true });
      if (RANGO[sesion.rol] < RANGO[r.rol]) {
        await auditar(sesion.usuario, 'acceso_denegado', sub, { metodo }, ip);
        throw new ErrorHttp(403, 'Su perfil no permite realizar esta acción.');
      }
    }

    const cuerpo = await leerCuerpo(req);
    const params = sub.match(r.re).slice(1);
    const salida = await r.fn({ req, res, ip, sesion, cuerpo, params, query: url.searchParams });
    if (r.descarga) res.setHeader('Content-Disposition', `attachment; filename="${r.descarga}"`);
    return responder(res, 200, salida);
  } catch (err) {
    if (err instanceof ErrorHttp) return responder(res, err.estado, { error: err.message, ...err.extra });
    console.error('Error de API:', err);
    return responder(res, 500, { error: 'Ocurrió un error interno. Intente nuevamente.' });
  }
}
