import { ESTADOS, STORAGE_KEY, STORAGE_KEY_V1, MIGRACION_ESTADOS } from './config.js';

// Registro de gestión por código de tipología. Se guarda en el navegador.
// Forma: { [codigo]: { estado, responsable, fecha, prioridad, accion, nota, actualizado, historial: [...] } }

const listeners = new Set();
let registros = {};
let almacenamientoDisponible = true;

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave) || 'null');
  } catch {
    almacenamientoDisponible = false;
    return null;
  }
}

function escribir() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch {
    almacenamientoDisponible = false;
  }
}

function migrarV1(v1) {
  const out = {};
  for (const [codigo, m] of Object.entries(v1 || {})) {
    out[codigo] = {
      estado: MIGRACION_ESTADOS[m.status] || 'Sin iniciar',
      responsable: m.owner || '',
      fecha: m.date || '',
      prioridad: m.priority || 'Media',
      accion: m.action || '',
      nota: m.note || '',
      actualizado: Date.now(),
      historial: [],
    };
  }
  return out;
}

export function iniciar() {
  const actual = leer(STORAGE_KEY);
  if (actual) {
    registros = actual;
  } else {
    const v1 = leer(STORAGE_KEY_V1);
    if (v1) {
      registros = migrarV1(v1);
      escribir();
    }
  }
}

export const disponible = () => almacenamientoDisponible;
export const todos = () => registros;
export const obtener = codigo => registros[codigo] || null;
export const estadoDe = codigo => registros[codigo]?.estado || ESTADOS[0];
export const suscribir = fn => (listeners.add(fn), () => listeners.delete(fn));
const avisar = () => listeners.forEach(fn => fn());

function resumen(r) {
  return { t: r.actualizado, estado: r.estado, responsable: r.responsable, accion: r.accion };
}

export function guardar(codigo, campos) {
  const previo = registros[codigo];
  const nuevo = {
    estado: ESTADOS[0], responsable: '', fecha: '', prioridad: 'Media', accion: '', nota: '',
    ...previo, ...campos, actualizado: Date.now(),
  };
  const cambio = !previo || ['estado', 'responsable', 'fecha', 'prioridad', 'accion', 'nota']
    .some(k => (previo[k] ?? '') !== (nuevo[k] ?? ''));
  if (!cambio) return false;
  nuevo.historial = [resumen(nuevo), ...(previo?.historial || [])].slice(0, 25);
  registros[codigo] = nuevo;
  escribir();
  avisar();
  return true;
}

export function limpiar(codigo) {
  delete registros[codigo];
  escribir();
  avisar();
}

export function exportarJSON() {
  return JSON.stringify({ version: 2, exportado: new Date().toISOString(), registros }, null, 1);
}

// Combina un archivo importado: conserva el registro más reciente de cada caso.
export function importarJSON(texto) {
  const datos = JSON.parse(texto);
  const entrantes = datos?.registros;
  if (!entrantes || typeof entrantes !== 'object') throw new Error('El archivo no contiene seguimientos.');
  let incorporados = 0;
  for (const [codigo, r] of Object.entries(entrantes)) {
    if (!ESTADOS.includes(r?.estado)) continue;
    if (!registros[codigo] || (r.actualizado || 0) > (registros[codigo].actualizado || 0)) {
      registros[codigo] = { ...r, historial: Array.isArray(r.historial) ? r.historial.slice(0, 25) : [] };
      incorporados++;
    }
  }
  escribir();
  avisar();
  return incorporados;
}
