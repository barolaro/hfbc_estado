import { esc } from './format.js';

const dlg = () => document.getElementById('modal');
let alCerrar = null;

export function iniciarModal() {
  const d = dlg();
  d.addEventListener('cancel', e => { if (d.dataset.cerrable === 'false') e.preventDefault(); });
  d.addEventListener('close', () => { const f = alCerrar; alCerrar = null; f?.(); });
  d.addEventListener('click', e => {
    if (d.dataset.cerrable === 'false') return;
    if (e.target === d || e.target.closest('[data-modal-cerrar]')) cerrar();
  });
}

export function abrir({ titulo, cuerpo, ancho = 'md', cerrable = true, alCerrar: fn = null }) {
  const d = dlg();
  d.dataset.ancho = ancho;
  d.dataset.cerrable = String(cerrable);
  alCerrar = fn;
  d.innerHTML = `<div class="modal-inner">
    <header class="modal-head"><h2 id="modal-title">${esc(titulo)}</h2>
      ${cerrable ? '<button type="button" class="icon-btn" data-modal-cerrar aria-label="Cerrar">×</button>' : ''}</header>
    <div class="modal-body" id="modal-body">${cuerpo}</div></div>`;
  if (!d.open) d.showModal();
  d.querySelector('input:not([type=hidden]), select, textarea')?.focus();
}

export const contenido = html => { document.getElementById('modal-body').innerHTML = html; };
export const cuerpoModal = () => document.getElementById('modal-body');
export function cerrar() { const d = dlg(); if (d.open) d.close(); }
export const abierto = () => dlg().open;
