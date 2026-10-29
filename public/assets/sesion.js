import { llamar } from './api.js';
import { esc } from './format.js';
import * as modal from './modal.js';

const el = id => document.getElementById(id);

export const ROLES = { admin: 'Administración', editor: 'Edición', lector: 'Solo lectura' };

/* ---------- Ingreso ---------- */

export function pedirIngreso(aviso = '') {
  el('app').hidden = true;
  el('login').hidden = false;
  const form = el('login-form'), error = el('login-error'), codigo = el('login-codigo');
  error.textContent = aviso;
  error.hidden = !aviso;
  form.clave.value = '';
  codigo.hidden = true;
  codigo.querySelector('input').value = '';
  (form.usuario.value ? form.clave : form.usuario).focus();

  return new Promise(resolve => {
    form.onsubmit = async e => {
      e.preventDefault();
      const boton = form.querySelector('button[type=submit]');
      boton.disabled = true;
      error.hidden = true;
      try {
        const r = await llamar('POST', '/login', {
          usuario: form.usuario.value.trim(),
          clave: form.clave.value,
          codigo: codigo.hidden ? undefined : codigo.querySelector('input').value,
        });
        form.reset();
        el('login').hidden = true;
        resolve(r.usuario);
      } catch (err) {
        if (err.extra.requiereCodigo) {
          codigo.hidden = false;
          codigo.querySelector('input').focus();
        } else {
          form.clave.value = '';
          form.clave.focus();
        }
        error.textContent = err.message;
        error.hidden = false;
      } finally {
        boton.disabled = false;
      }
    };
  });
}

export async function salir() {
  try { await llamar('POST', '/logout', {}); } catch { /* la sesión ya no existía */ }
}

/* ---------- Cambio de clave ---------- */

const REGLAS = 'Mínimo 12 caracteres, con letras y números. No use su nombre de usuario.';

function formClave(obligatorio) {
  return `<form id="form-clave" autocomplete="off">
    ${obligatorio ? '<p class="hint">Ingresó con una clave temporal. Defina una clave personal para continuar.</p>' : ''}
    <div class="form-stack">
      <label class="field"><span>Clave actual</span><input name="actual" type="password" autocomplete="current-password" required></label>
      <label class="field"><span>Clave nueva</span><input name="nueva" type="password" autocomplete="new-password" minlength="12" required><small class="muted">${REGLAS}</small></label>
      <label class="field"><span>Repita la clave nueva</span><input name="repetir" type="password" autocomplete="new-password" required></label>
    </div>
    <p class="form-error" id="form-clave-error" role="alert" hidden></p>
    <div class="form-actions"><button type="submit" class="btn">Guardar clave</button></div>
  </form>`;
}

export function exigirCambioClave(usuario) {
  return new Promise(resolve => {
    modal.abrir({ titulo: 'Defina su clave personal', cerrable: false, cuerpo: formClave(true) });
    modal.cuerpoModal().addEventListener('clave-cambiada', () => { modal.cerrar(); resolve(); }, { once: true });
  });
}

/* ---------- Mi cuenta ---------- */

function vistaCuenta(usuario) {
  return `<dl class="datos-cuenta">
      <div><dt>Nombre</dt><dd>${esc(usuario.nombre)}</dd></div>
      <div><dt>Usuario</dt><dd>${esc(usuario.usuario)}</dd></div>
      <div><dt>Perfil</dt><dd>${esc(ROLES[usuario.rol])}</dd></div>
    </dl>
    <section class="bloque"><h3>Cambiar clave</h3>${formClave(false)}</section>
    <section class="bloque" id="bloque-2fa">${bloque2fa(usuario)}</section>`;
}

function bloque2fa(usuario) {
  if (usuario.totp) {
    return `<h3>Verificación en dos pasos</h3>
      <p><span class="etiqueta ok">Activada</span> Al ingresar se pide un código de su aplicación de autenticación.</p>
      <form id="form-2fa-off" autocomplete="off"><label class="field"><span>Para desactivarla, confirme su clave</span>
        <input name="clave" type="password" autocomplete="current-password" required></label>
        <p class="form-error" id="form-2fa-error" role="alert" hidden></p>
        <div class="form-actions"><button type="submit" class="btn btn-ghost">Desactivar</button></div></form>`;
  }
  return `<h3>Verificación en dos pasos</h3>
    <p class="muted">Agrega un código temporal de su teléfono además de la clave. Recomendada para quienes administran o editan.</p>
    <p class="form-error" id="form-2fa-error" role="alert" hidden></p>
    <div class="form-actions"><button type="button" class="btn btn-ghost" data-accion="2fa-iniciar">Activar</button></div>`;
}

export function abrirCuenta(usuario) {
  modal.abrir({ titulo: 'Mi cuenta', cuerpo: vistaCuenta(usuario) });
}

function mostrarError(id, texto) {
  const e = document.getElementById(id);
  if (!e) return;
  e.textContent = texto;
  e.hidden = !texto;
}

// Eventos del modal de cuenta. Devuelve true si el evento fue atendido.
export async function manejarClick(e, usuario) {
  const b = e.target.closest('[data-accion="2fa-iniciar"]');
  if (!b) return false;
  b.disabled = true;
  try {
    const r = await llamar('POST', '/cuenta/2fa/iniciar', {});
    el('bloque-2fa').innerHTML = `<h3>Verificación en dos pasos</h3>
      <ol class="pasos-2fa">
        <li>Instale una aplicación de autenticación (Google Authenticator, Microsoft Authenticator u otra).</li>
        <li>Escanee este código o ingrese la clave manualmente.</li>
        <li>Escriba el código de 6 dígitos que muestra la aplicación.</li>
      </ol>
      <img class="qr" src="${r.qr}" width="220" height="220" alt="Código QR para la aplicación de autenticación">
      <p class="small muted">Clave manual: <code>${esc(r.secreto)}</code></p>
      <form id="form-2fa-on" autocomplete="off"><label class="field"><span>Código de 6 dígitos</span>
        <input name="codigo" inputmode="numeric" pattern="\\d{6}" maxlength="6" autocomplete="one-time-code" required></label>
        <p class="form-error" id="form-2fa-error" role="alert" hidden></p>
        <div class="form-actions"><button type="submit" class="btn">Activar</button></div></form>`;
    el('bloque-2fa').querySelector('input').focus();
  } catch (err) {
    b.disabled = false;
    mostrarError('form-2fa-error', err.message);
  }
  return true;
}

// Envíos de formularios de cuenta. `alCambiar` recibe el usuario actualizado.
export async function manejarEnvio(e, usuario, alCambiar, aviso) {
  const f = e.target;
  if (f.id === 'form-clave') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d.nueva !== d.repetir) return mostrarError('form-clave-error', 'Las claves nuevas no coinciden.'), true;
    try {
      await llamar('POST', '/cuenta/clave', { actual: d.actual, nueva: d.nueva });
      f.reset();
      mostrarError('form-clave-error', '');
      aviso('Clave actualizada');
      modal.cuerpoModal().dispatchEvent(new CustomEvent('clave-cambiada'));
      alCambiar({ ...usuario, debeCambiarClave: false });
    } catch (err) { mostrarError('form-clave-error', err.message); }
    return true;
  }
  if (f.id === 'form-2fa-on' || f.id === 'form-2fa-off') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    try {
      if (f.id === 'form-2fa-on') await llamar('POST', '/cuenta/2fa/activar', { codigo: d.codigo });
      else await llamar('POST', '/cuenta/2fa/desactivar', { clave: d.clave });
      const nuevo = { ...usuario, totp: f.id === 'form-2fa-on' };
      alCambiar(nuevo);
      el('bloque-2fa').innerHTML = bloque2fa(nuevo);
      aviso(nuevo.totp ? 'Verificación en dos pasos activada' : 'Verificación en dos pasos desactivada');
    } catch (err) { mostrarError('form-2fa-error', err.message); }
    return true;
  }
  return false;
}
