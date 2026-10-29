const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const int = v => (v == null || v === '' ? '—' : nf0.format(v));
export const uf = v => (v == null || v === '' ? '—' : nf2.format(v));
export const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

export function fecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export function fechaHora(ts) {
  return new Date(ts).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);

export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csv(filas) {
  const celda = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return '﻿' + filas.map(f => f.map(celda).join(';')).join('\n');
}
