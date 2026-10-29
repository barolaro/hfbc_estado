import { readFileSync } from 'node:fs';
import pg from 'pg';

let pool;

export function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new ErrorHttp(503, 'La base de datos no está configurada.');
    pool = new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  }
  return pool;
}

export class ErrorHttp extends Error {
  constructor(estado, mensaje, extra = {}) {
    super(mensaje);
    this.estado = estado;
    this.extra = extra;
  }
}

export const q = (texto, params = []) => db().query(texto, params);

const ESQUEMA = `
create table if not exists usuarios (
  id serial primary key,
  usuario text unique not null,
  nombre text not null,
  rol text not null check (rol in ('admin','editor','lector')),
  clave_hash text not null,
  debe_cambiar boolean not null default true,
  activo boolean not null default true,
  totp_secreto text,
  totp_activo boolean not null default false,
  totp_ultimo bigint not null default 0,
  creado_en timestamptz not null default now(),
  clave_cambiada_en timestamptz,
  ultimo_acceso timestamptz
);
create table if not exists sesiones (
  id_hash text primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  creada timestamptz not null default now(),
  ultima timestamptz not null default now(),
  expira timestamptz not null,
  ip text,
  ua text
);
create index if not exists sesiones_usuario on sesiones(usuario_id);
create table if not exists intentos (
  id bigserial primary key,
  clave text not null,
  ts timestamptz not null default now()
);
create index if not exists intentos_clave_ts on intentos(clave, ts);
create table if not exists equipos (
  codigo int primary key,
  datos jsonb not null,
  version int not null default 1,
  eliminado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  actualizado_por text
);
create table if not exists equipos_historial (
  id bigserial primary key,
  codigo int not null,
  ts timestamptz not null default now(),
  usuario text,
  version int,
  datos jsonb
);
create index if not exists equipos_historial_codigo on equipos_historial(codigo, ts desc);
create table if not exists seguimiento (
  codigo int primary key references equipos(codigo),
  datos jsonb not null,
  version int not null default 1,
  actualizado_en timestamptz not null default now(),
  actualizado_por text
);
create table if not exists seguimiento_historial (
  id bigserial primary key,
  codigo int not null,
  ts timestamptz not null default now(),
  usuario text,
  estado text,
  responsable text,
  accion text
);
create index if not exists seguimiento_historial_codigo on seguimiento_historial(codigo, ts desc);
create table if not exists auditoria (
  id bigserial primary key,
  ts timestamptz not null default now(),
  usuario text,
  accion text not null,
  entidad text,
  detalle jsonb,
  ip text
);
create index if not exists auditoria_ts on auditoria(ts desc);
`;

let listo = null;

// Crea las tablas, carga los datos iniciales y el primer administrador. Una vez por arranque.
export function preparar() {
  listo ??= iniciar().catch(err => { listo = null; throw err; });
  return listo;
}

async function iniciar() {
  const cli = await db().connect();
  try {
    await cli.query('begin');
    await cli.query('select pg_advisory_xact_lock(7001)');
    await cli.query(ESQUEMA);

    const { rows: [{ n }] } = await cli.query('select count(*)::int as n from equipos');
    if (n === 0) {
      const semilla = JSON.parse(readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
      for (const { codigo, ...datos } of semilla) {
        await cli.query(
          `insert into equipos (codigo, datos, actualizado_por) values ($1, $2, 'sistema') on conflict do nothing`,
          [codigo, datos]);
      }
      await cli.query(`insert into auditoria (usuario, accion, entidad, detalle) values ('sistema','carga_inicial','equipos',$1)`,
        [{ cantidad: semilla.length }]);
    }

    const { rows: [{ u }] } = await cli.query('select count(*)::int as u from usuarios');
    const admin = process.env.ADMIN_INICIAL_USUARIO;
    const hash = process.env.ADMIN_INICIAL_HASH;
    if (u === 0 && admin && hash) {
      await cli.query(
        `insert into usuarios (usuario, nombre, rol, clave_hash, debe_cambiar)
         values ($1, $2, 'admin', $3, true) on conflict do nothing`,
        [admin.toLowerCase(), process.env.ADMIN_INICIAL_NOMBRE || 'Administrador', hash]);
      await cli.query(`insert into auditoria (usuario, accion, entidad, detalle) values ('sistema','admin_inicial','usuarios',$1)`,
        [{ usuario: admin.toLowerCase() }]);
    }
    await cli.query('commit');
  } catch (err) {
    await cli.query('rollback').catch(() => {});
    throw err;
  } finally {
    cli.release();
  }
}

export async function auditar(usuario, accion, entidad, detalle, ip) {
  try {
    await q('insert into auditoria (usuario, accion, entidad, detalle, ip) values ($1,$2,$3,$4,$5)',
      [usuario, accion, entidad ?? null, detalle ?? null, ip ?? null]);
  } catch (err) {
    console.error('No se pudo registrar la auditoría:', err.message);
  }
}
