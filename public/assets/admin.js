import { llamar } from './api.js';
import { descargar, esc, fechaHora } from './format.js';
import * as modal from './modal.js';
import { ROLES } from './sesion.js';

const ACCIONES = {
  login: 'Ingreso', logout: 'Salida', login_fallido: 'Ingreso fallido', login_bloqueado: 'Ingreso bloqueado',
  login_codigo_invalido: 'Código de dos pasos inválido', clave_cambiada: 'Cambio de clave', clave_reiniciada: 'Clave reiniciada',
  usuario_creado: 'Usuario creado', usuario_modificado: 'Usuario modificado', '2fa_activado': 'Dos pasos activado',
  '2fa_desactivado': 'Dos pasos desactivado', equipo_creado: 'Equipo agregado', equipo_modificado: 'Equipo modificado',
  equipo_eliminado: 'Equipo eliminado', seguimiento_guardado: 'Seguimiento guardado', seguimiento_limpiado: 'Seguimiento limpiado',
  acceso_denegado: 'Acceso denegado', respaldo_descargado: 'Respaldo descargado', carga_inicial: 'Carga inicial', admin_inicial: 'Administración inicial',
};
const GRAVES = new Set(['login_fallido', 'login_bloqueado', 'login_codigo_invalido', 'acceso_denegado']);

let usuarios = [];
let yo = null;
let pestana = 'usuarios';
let secreto = null;

const rolOpciones = sel => Object.entries(ROLES).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${v}</option>`).join('');

function marco() {
  const tab = (id, texto) => `<button type="button" role="tab" data-pestana="${id}" aria-selected="${pestana === id}">${texto}</button>`;
  return `<div class="view-switch" role="tablist" aria-label="Secciones de administración">
      ${tab('usuarios', 'Usuarios')}${tab('actividad', 'Actividad')}${tab('respaldo', 'Respaldo')}</div>
    <div id="admin-panel" role="tabpanel"></div>`;
}

function vistaUsuarios() {
  const aviso = secreto ? `<div class="secreto" role="status">
      <p><b>Clave temporal de ${esc(secreto.usuario)}</b>. Se muestra una sola vez; entréguela por un canal seguro.</p>
      <p><code id="clave-temporal">${esc(secreto.clave)}</code>
      <button type="button" class="btn btn-ghost" data-admin="copiar">Copiar</button></p>
      <p class="small muted">La persona deberá cambiarla al ingresar.</p></div>` : '';
  const filas = usuarios.map(u => `<tr>
      <td><b>${esc(u.usuario)}</b><br><span class="muted small">${esc(u.nombre)}</span></td>
      <td><select data-admin="rol" data-id="${u.id}" aria-label="Perfil de ${esc(u.usuario)}"${u.usuario === yo.usuario ? ' disabled' : ''}>${rolOpciones(u.rol)}</select></td>
      <td><span class="etiqueta ${u.activo ? 'ok' : 'off'}">${u.activo ? 'Activo' : 'Inactivo'}</span>${u.totp ? ' <span class="etiqueta ok">2 pasos</span>' : ''}${u.debeCambiarClave ? ' <span class="etiqueta">Clave temporal</span>' : ''}</td>
      <td class="small">${u.ultimoAcceso ? fechaHora(u.ultimoAcceso) : 'Nunca'}</td>
      <td class="acciones-fila">
        ${u.usuario === yo.usuario ? '' : `<button type="button" class="btn btn-ghost" data-admin="activo" data-id="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>
        <button type="button" class="btn btn-ghost" data-admin="reiniciar" data-id="${u.id}">Reiniciar clave</button>`}
      </td></tr>`).join('');
  return `${aviso}
    <div class="table-wrap tabla-admin"><table class="grid"><thead><tr><th scope="col"><span class="th">Usuario</span></th><th scope="col"><span class="th">Perfil</span></th><th scope="col"><span class="th">Estado</span></th><th scope="col"><span class="th">Último ingreso</span></th><th scope="col"><span class="th">Acciones</span></th></tr></thead><tbody>${filas}</tbody></table></div>
    <form id="form-usuario" class="bloque" autocomplete="off">
      <h3>Crear usuario</h3>
      <div class="form-grid">
        <label class="field"><span>Usuario</span><input name="usuario" required minlength="3" maxlength="40" pattern="[a-z0-9][a-z0-9._\\-]{2,39}" placeholder="nombre.apellido"><small class="muted">Minúsculas, números, punto o guion.</small></label>
        <label class="field"><span>Nombre completo</span><input name="nombre" required maxlength="100"></label>
        <label class="field"><span>Perfil</span><select name="rol">${rolOpciones('editor')}</select></label>
      </div>
      <p class="small muted"><b>Administración</b>: gestiona usuarios y ve la actividad. <b>Edición</b>: carga y modifica equipos y seguimiento. <b>Solo lectura</b>: consulta sin modificar.</p>
      <p class="form-error" id="form-usuario-error" role="alert" hidden></p>
      <div class="form-actions"><button type="submit" class="btn">Crear usuario</button></div>
    </form>`;
}

async function vistaActividad() {
  const { eventos } = await llamar('GET', '/auditoria?limite=150');
  const filas = eventos.map(e => `<tr${GRAVES.has(e.accion) ? ' class="alerta"' : ''}>
    <td class="small">${fechaHora(e.ts)}</td><td>${esc(e.usuario || '—')}</td>
    <td>${esc(ACCIONES[e.accion] || e.accion)}</td><td class="small">${esc(String(e.entidad || '').replace('equipo:', 'Equipo ').replace('usuario:', 'Usuario '))}</td>
    <td class="small muted">${esc(e.ip || '')}</td></tr>`).join('');
  return `<p class="muted small">Últimos ${eventos.length} eventos. Cada ingreso, cambio y acceso denegado queda registrado con su autor.</p>
    <div class="table-wrap tabla-admin"><table class="grid"><thead><tr><th scope="col"><span class="th">Fecha</span></th><th scope="col"><span class="th">Usuario</span></th><th scope="col"><span class="th">Acción</span></th><th scope="col"><span class="th">Detalle</span></th><th scope="col"><span class="th">IP</span></th></tr></thead><tbody>${filas}</tbody></table></div>`;
}

const vistaRespaldo = () => `<section class="bloque">
    <h3>Respaldo de la información</h3>
    <p>Descarga todos los equipos, el seguimiento y su historial en un archivo. No incluye claves.</p>
    <p class="muted small">La base de datos además conserva un historial de cambios por equipo y permite restaurar a un momento anterior desde el panel del proveedor. Guarde una copia periódica en una carpeta institucional.</p>
    <div class="form-actions"><button type="button" class="btn" data-admin="respaldo">Descargar respaldo</button></div>
  </section>`;

async function pintar() {
  const panel = document.getElementById('admin-panel');
  panel.innerHTML = '<p class="muted">Cargando…</p>';
  try {
    if (pestana === 'usuarios') {
      usuarios = (await llamar('GET', '/usuarios')).usuarios;
      panel.innerHTML = vistaUsuarios();
    } else if (pestana === 'actividad') panel.innerHTML = await vistaActividad();
    else panel.innerHTML = vistaRespaldo();
  } catch (err) {
    panel.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
  }
  document.querySelectorAll('[data-pestana]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pestana === pestana)));
}

export function abrirAdmin(usuario) {
  yo = usuario;
  pestana = 'usuarios';
  secreto = null;
  modal.abrir({ titulo: 'Administración', ancho: 'lg', cuerpo: marco(), alCerrar: () => { secreto = null; } });
  pintar();
}

export async function manejarClick(e, aviso) {
  const p = e.target.closest('[data-pestana]');
  if (p) { pestana = p.dataset.pestana; secreto = null; pintar(); return true; }
  const b = e.target.closest('[data-admin]');
  if (!b) return false;
  const id = Number(b.dataset.id);
  const u = usuarios.find(x => x.id === id);
  try {
    switch (b.dataset.admin) {
      case 'activo':
        if (u.activo && !confirm(`¿Desactivar a ${u.usuario}? Se cerrará su sesión.`)) break;
        await llamar('PUT', `/usuarios/${id}`, { activo: !u.activo });
        aviso(u.activo ? 'Usuario desactivado' : 'Usuario activado');
        await pintar();
        break;
      case 'reiniciar': {
        if (!confirm(`¿Reiniciar la clave de ${u.usuario}? Se cerrarán sus sesiones.`)) break;
        const quitar2fa = u.totp && confirm('¿Quitar también su verificación en dos pasos? (Acepte si perdió el teléfono.)');
        const r = await llamar('POST', `/usuarios/${id}/reiniciar`, { quitar2fa });
        secreto = { usuario: u.usuario, clave: r.claveTemporal };
        await pintar();
        break;
      }
      case 'copiar':
        await navigator.clipboard?.writeText(secreto.clave);
        aviso('Clave copiada');
        break;
      case 'respaldo': {
        const datos = await llamar('GET', '/respaldo');
        const fecha = new Date().toISOString().slice(0, 10);
        descargar(`respaldo_tablero_vu_hfbc_${fecha}.json`, JSON.stringify(datos, null, 1), 'application/json');
        aviso('Respaldo descargado');
        break;
      }
    }
  } catch (err) { aviso(err.message); }
  return true;
}

export async function manejarEnvio(e, aviso) {
  const rol = e.target.closest?.('[data-admin="rol"]');
  if (e.type === 'change' && rol) {
    try {
      await llamar('PUT', `/usuarios/${rol.dataset.id}`, { rol: rol.value });
      aviso('Perfil actualizado');
    } catch (err) { aviso(err.message); }
    await pintar();
    return true;
  }
  if (e.type === 'submit' && e.target.id === 'form-usuario') {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const err = document.getElementById('form-usuario-error');
    try {
      const r = await llamar('POST', '/usuarios', { usuario: d.usuario.trim().toLowerCase(), nombre: d.nombre.trim(), rol: d.rol });
      secreto = { usuario: r.usuario.usuario, clave: r.claveTemporal };
      await pintar();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    return true;
  }
  return false;
}
