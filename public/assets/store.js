import { ESTADOS } from './config.js';
import { llamar } from './api.js';

// Seguimiento de gestión por código de tipología. La fuente de verdad es el servidor;
// aquí queda una copia en memoria para dibujar la pantalla.
// Forma: { [codigo]: { estado, responsable, fecha, prioridad, accion, nota, version, actualizado, actualizadoPor, historial } }

const listeners = new Set();
let registros = {};

const avisar = () => listeners.forEach(fn => fn());

export async function recargar({ notificar = true } = {}) {
  const { registros: nuevos } = await llamar('GET', '/seguimiento');
  registros = nuevos;
  if (notificar) avisar();
}

export const iniciar = () => recargar({ notificar: false });
export const todos = () => registros;
export const obtener = codigo => registros[codigo] || null;
export const estadoDe = codigo => registros[codigo]?.estado || ESTADOS[0];
export const suscribir = fn => (listeners.add(fn), () => listeners.delete(fn));

// Devuelve true si hubo cambios. Si otra persona editó antes, se actualiza la copia y se lanza el error.
export async function guardar(codigo, campos) {
  try {
    const r = await llamar('PUT', `/seguimiento/${codigo}`, { version: registros[codigo]?.version ?? 0, campos });
    if (r.registro) registros[codigo] = r.registro;
    if (!r.sinCambios) avisar();
    return !r.sinCambios;
  } catch (err) {
    if (err.estado === 409) {
      if (err.extra.actual) registros[codigo] = err.extra.actual; else delete registros[codigo];
      avisar();
    }
    throw err;
  }
}

export async function limpiar(codigo) {
  await llamar('DELETE', `/seguimiento/${codigo}`);
  await recargar();
}
