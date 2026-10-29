import { RESULTADOS, RESULTADO_POR_ID, ESTADOS, PRIORIDADES, INSTANCIAS } from './config.js';
import { int, uf, pct, fecha, fechaHora, esc, norm, descargar, csv } from './format.js';
import * as store from './store.js';
import { llamar, enExpiracion } from './api.js';
import * as modal from './modal.js';
import * as sesion from './sesion.js';
import * as admin from './admin.js';
import { formularioEquipo, leerFormulario } from './equipos.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = id => document.getElementById(id);

const BRECHA = '__brecha';
const state = {
  casos: [],
  filtros: { q: '', resultado: '', ctar: '', anio: '', gestion: '' },
  orden: { clave: 'codigo', dir: 1 },
  vista: 'tabla',
  abierto: null,
  disparador: null,
  usuario: null,
};

const puedeEditar = () => ['admin', 'editor'].includes(state.usuario?.rol);
const esAdmin = () => state.usuario?.rol === 'admin';

/* ---------- Carga ---------- */

async function cargar() {
  state.casos = (await llamar('GET', '/equipos')).equipos;
}

/* ---------- Derivados ---------- */

const ordenResultado = Object.fromEntries(RESULTADOS.map((r, i) => [r.id, i]));
const esBrecha = c => RESULTADO_POR_ID[c.resultado]?.grupo === 'brecha';

function coincide(c, f = state.filtros) {
  if (f.resultado === BRECHA ? !esBrecha(c) : f.resultado && c.resultado !== f.resultado) return false;
  if (f.ctar && c.estadoCtar !== f.ctar) return false;
  if (f.anio && c.anioIb !== f.anio) return false;
  if (f.gestion && store.estadoDe(c.codigo) !== f.gestion) return false;
  if (f.q) {
    const texto = norm(`${c.codigo} ${c.equipo}`);
    if (!norm(f.q).split(/\s+/).every(t => texto.includes(t))) return false;
  }
  return true;
}

const hayFiltros = () => Object.values(state.filtros).some(Boolean);
const visibles = () => state.casos.filter(c => coincide(c));

const getters = {
  codigo: c => c.codigo,
  equipo: c => norm(c.equipo),
  resultado: c => ordenResultado[c.resultado],
  plan: c => c.plan ?? -1,
  hospital: c => c.hospital ?? -1,
  ctar: c => norm(c.estadoCtar),
  uf: c => c.uf ?? -1,
  gestion: c => ESTADOS.indexOf(store.estadoDe(c.codigo)),
  fecha: c => store.obtener(c.codigo)?.fecha || '9999-99-99',
};

function ordenados(lista) {
  const { clave, dir } = state.orden;
  const g = getters[clave];
  return [...lista].sort((a, b) => {
    const x = g(a), y = g(b);
    return (x < y ? -1 : x > y ? 1 : a.codigo - b.codigo) * dir;
  });
}

const chip = (resultadoId, texto) => {
  const r = RESULTADO_POR_ID[resultadoId];
  return `<span class="chip" style="--c:${r?.color || '#56697c'}"><i></i>${esc(texto ?? r?.etiqueta ?? resultadoId)}</span>`;
};

const hoy = () => new Date().toISOString().slice(0, 10);

/* ---------- Resumen superior ---------- */

function renderResumen() {
  const total = state.casos.length;
  const cuenta = id => state.casos.filter(c => c.resultado === id).length;
  const ok = state.casos.filter(c => !esBrecha(c)).length;
  const brecha = total - ok;
  const enPlan = state.casos.filter(c => c.plan != null);
  const enHospital = state.casos.filter(c => c.hospital != null).length;
  const ambos = state.casos.filter(c => c.plan != null && c.hospital != null).length;
  const ufPlan = enPlan.reduce((s, c) => s + (c.uf || 0), 0);

  el('overview-title').textContent =
    `De ${total} tipologías, ${ok} coinciden entre el Plan CTAR y el registro del Hospital; ${brecha} requieren conciliación.`;
  el('overview-sub').textContent =
    'Cada casilla es una tipología. Seleccione una para abrir su ficha o use la leyenda para filtrar.';

  el('figures').innerHTML = `
    <div><dt>Plan CTAR</dt><dd>${int(enPlan.length)}<small>UF ${uf(ufPlan)} proyectadas</small></dd></div>
    <div><dt>Registro del Hospital</dt><dd>${int(enHospital)}<small>tipologías informadas</small></dd></div>
    <div><dt>En ambos registros</dt><dd>${int(ambos)}<small>${pct(ok, total)}% sin diferencias</small></dd></div>`;

  el('legend').innerHTML = RESULTADOS.map(r => `
    <button type="button" class="legend-item" data-resultado="${esc(r.id)}" style="--c:${r.color}"
      aria-pressed="${state.filtros.resultado === r.id}" title="${esc(r.ayuda)}">
      <i></i><span>${esc(r.etiqueta)}</span><b>${int(cuenta(r.id))}</b>
    </button>`).join('');

  renderTiles();
  renderAvance();
}

function renderTiles() {
  const orden = [...state.casos].sort((a, b) =>
    ordenResultado[a.resultado] - ordenResultado[b.resultado] || a.codigo - b.codigo);
  const regs = store.todos();
  el('tilemap').innerHTML = orden.map((c, i) => {
    const r = RESULTADO_POR_ID[c.resultado];
    const inicioGrupo = i > 0 && orden[i - 1].resultado !== c.resultado;
    const gestionado = regs[c.codigo] && regs[c.codigo].estado !== ESTADOS[0];
    return `<button type="button" class="tile${inicioGrupo ? ' grupo' : ''}${gestionado ? ' managed' : ''}${coincide(c) ? '' : ' dim'}"
      data-codigo="${c.codigo}" style="--c:${r.color}"
      aria-label="${esc(`${c.codigo} ${c.equipo}. ${r.etiqueta}. Plan ${int(c.plan)}, Hospital ${int(c.hospital)}.`)}"></button>`;
  }).join('');
}

function renderAvance() {
  const total = state.casos.length;
  const conteo = ESTADOS.map(e => state.casos.filter(c => store.estadoDe(c.codigo) === e).length);
  const registrados = Object.keys(store.todos()).filter(k => state.casos.some(c => String(c.codigo) === k)).length;
  const cerrados = conteo[ESTADOS.length - 1];
  const barra = el('progress');
  barra.innerHTML = conteo.map((n, i) => n ? `<span data-paso="${i}" style="flex:${n}"></span>` : '').join('');
  barra.setAttribute('aria-label', ESTADOS.map((e, i) => `${e}: ${conteo[i]}`).join('. '));
  el('progress-text').textContent = registrados
    ? `${int(registrados)} de ${int(total)} tipologías con seguimiento registrado; ${int(cerrados)} cerradas con respaldo.`
    : `Aún no hay seguimientos registrados. Abra una tipología para asignar responsable y plazo.`;
}

/* ---------- Lectura del cruce ---------- */

function renderInsights() {
  const rango = { 'Solo registro Hospital': 0, 'Diferencia de cantidad': 1, 'Solo plan CTAR': 2 };
  const brechas = state.casos.filter(esBrecha)
    .sort((a, b) => rango[a.resultado] - rango[b.resultado] || (b.uf || 0) - (a.uf || 0));

  el('priority').innerHTML = brechas.slice(0, 6).map(c => `
    <li><button type="button" class="prio" data-codigo="${c.codigo}">
      <span class="prio-main"><b>${c.codigo}</b> ${esc(c.equipo)}</span>
      <span class="prio-meta">${chip(c.resultado)}
        <span>Plan ${int(c.plan)} · Hospital ${int(c.hospital)}</span>
        ${c.uf != null ? `<span>UF ${uf(c.uf)}</span>` : ''}</span>
    </button></li>`).join('');
  el('btn-all-gaps').textContent = `Ver los ${brechas.length} casos con brecha`;

  const conteo = new Map();
  state.casos.forEach(c => conteo.set(c.estadoCtar, (conteo.get(c.estadoCtar) || 0) + 1));
  const filas = [...conteo].sort((a, b) => b[1] - a[1]);
  const max = filas[0][1];
  el('ctar-bars').innerHTML = filas.map(([nombre, n]) => `
    <button type="button" class="bar" data-ctar="${esc(nombre)}" aria-pressed="${state.filtros.ctar === nombre}">
      <span class="bar-label">${esc(nombre)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(n / max) * 100}%"></span></span>
      <b>${int(n)}</b>
    </button>`).join('');
}

/* ---------- Gestión: filtros, tabla y tablero ---------- */

function poblarFiltros() {
  const opciones = (lista, vacio) => `<option value="">${vacio}</option>` +
    lista.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
  const cuenta = id => state.casos.filter(c => c.resultado === id).length;
  el('f-result').innerHTML = opciones([
    [BRECHA, `Con brecha (${state.casos.filter(esBrecha).length})`],
    ...RESULTADOS.map(r => [r.id, `${r.etiqueta} (${cuenta(r.id)})`]),
  ], 'Todos');
  const ctar = [...new Set(state.casos.map(c => c.estadoCtar))].sort((a, b) => a.localeCompare(b, 'es'));
  el('f-ctar').innerHTML = opciones(ctar.map(v => [v, v]), 'Todas');
  const anios = [...new Set(state.casos.map(c => c.anioIb).filter(Boolean))].sort();
  el('f-year').innerHTML = opciones(anios.map(v => [v, v]), 'Todos');
}

function sincronizarControles() {
  const f = state.filtros;
  el('f-q').value = f.q;
  el('f-result').value = f.resultado;
  el('f-ctar').value = f.ctar;
  el('f-year').value = f.anio;
  document.querySelectorAll('.legend-item').forEach(b =>
    b.setAttribute('aria-pressed', String(f.resultado === b.dataset.resultado)));
  document.querySelectorAll('.bar').forEach(b =>
    b.setAttribute('aria-pressed', String(f.ctar === b.dataset.ctar)));
  el('btn-clear').disabled = !hayFiltros();
}

function renderPasos() {
  el('steps').innerHTML = ESTADOS.map((e, i) => {
    const n = state.casos.filter(c => store.estadoDe(c.codigo) === e).length;
    return `<li><button type="button" class="step" data-gestion="${esc(e)}" aria-pressed="${state.filtros.gestion === e}">
      <span class="step-n">${i + 1}</span><span class="step-name">${esc(e)}</span><b>${int(n)}</b></button></li>`;
  }).join('');
}

const COLUMNAS = [
  ['codigo', 'Código', ''], ['equipo', 'Equipo', ''], ['resultado', 'Cruce', ''],
  ['plan', 'Plan', 'num'], ['hospital', 'Hospital', 'num'], ['ctar', 'Situación CTAR', ''],
  ['uf', 'UF proyectado', 'num'], ['gestion', 'Gestión', ''], ['fecha', 'Plazo', ''],
];

function renderTabla(lista) {
  const { clave, dir } = state.orden;
  el('thead').innerHTML = `<tr>${COLUMNAS.map(([k, t, cls]) => `
    <th class="${cls}" scope="col" aria-sort="${clave === k ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">
      <button type="button" data-orden="${k}">${t}<span aria-hidden="true">${clave === k ? (dir > 0 ? '▲' : '▼') : ''}</span></button>
    </th>`).join('')}</tr>`;

  if (!lista.length) {
    el('rows').innerHTML = `<tr><td colspan="${COLUMNAS.length}" class="empty">Ninguna tipología coincide con los filtros. Pruebe con otro término o limpie los filtros.</td></tr>`;
    return;
  }
  const hoyISO = hoy();
  el('rows').innerHTML = ordenados(lista).map(c => {
    const reg = store.obtener(c.codigo);
    const estado = reg?.estado || ESTADOS[0];
    const vencido = reg?.fecha && reg.fecha < hoyISO && estado !== ESTADOS[ESTADOS.length - 1];
    return `<tr tabindex="0" data-codigo="${c.codigo}">
      <td><b>${c.codigo}</b></td>
      <td>${esc(c.equipo)}</td>
      <td>${chip(c.resultado)}</td>
      <td class="num">${int(c.plan)}</td>
      <td class="num">${int(c.hospital)}</td>
      <td>${esc(c.estadoCtar)}</td>
      <td class="num">${uf(c.uf)}</td>
      <td><span class="estado" data-paso="${ESTADOS.indexOf(estado)}">${esc(estado)}</span></td>
      <td class="${vencido ? 'vencido' : ''}">${reg?.fecha ? fecha(reg.fecha) + (vencido ? ' · vencido' : '') : '—'}</td>
    </tr>`;
  }).join('');
}

const LIMITE_COLUMNA = 30;

function renderTablero(lista) {
  const porEstado = Object.fromEntries(ESTADOS.map(e => [e, []]));
  ordenados(lista).forEach(c => porEstado[store.estadoDe(c.codigo)].push(c));
  el('board').innerHTML = ESTADOS.map((e, i) => {
    const casos = porEstado[e];
    const tarjetas = casos.slice(0, LIMITE_COLUMNA).map(c => {
      const reg = store.obtener(c.codigo);
      return `<article class="card" draggable="${puedeEditar()}" tabindex="0" data-codigo="${c.codigo}">
        <header><b>${c.codigo}</b>${chip(c.resultado)}</header>
        <p>${esc(c.equipo)}</p>
        <footer><span>${c.uf != null ? 'UF ' + uf(c.uf) : 'Sin valor en Plan'}</span>
          <span>${esc(reg?.responsable || 'Sin responsable')}${reg?.fecha ? ' · ' + fecha(reg.fecha) : ''}</span></footer>
      </article>`;
    }).join('');
    const resto = casos.length - LIMITE_COLUMNA;
    return `<section class="col" data-estado="${esc(e)}" aria-label="${esc(e)}">
      <h3><span class="step-n">${i + 1}</span>${esc(e)}<b>${int(casos.length)}</b></h3>
      <div class="col-body">${tarjetas || `<p class="col-empty">${puedeEditar() ? 'Arrastre aquí un caso o cámbielo desde su ficha.' : 'Sin casos en este paso.'}</p>`}
      ${resto > 0 ? `<p class="col-more">y ${int(resto)} más. Use los filtros para acotar.</p>` : ''}</div>
    </section>`;
  }).join('');
}

function renderGestion() {
  const lista = visibles();
  el('summary').textContent = `Mostrando ${int(lista.length)} de ${int(state.casos.length)} tipologías.`;
  renderPasos();
  sincronizarControles();
  if (state.vista === 'tabla') renderTabla(lista); else renderTablero(lista);
}

function renderTodo() {
  renderResumen();
  renderInsights();
  renderGestion();
  if (state.abierto != null) renderFicha(state.abierto);
}

function aplicarFiltro(parcial, { irAGestion = false } = {}) {
  Object.assign(state.filtros, parcial);
  renderResumen();
  renderInsights();
  renderGestion();
  if (irAGestion) el('gestion').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Ficha del caso ---------- */

const dato = v => (v === '' || v == null ? '—' : esc(v));

function renderFicha(codigo) {
  const c = state.casos.find(x => x.codigo === codigo);
  if (!c) return;
  const r = RESULTADO_POR_ID[c.resultado];
  const reg = store.obtener(codigo) || {};
  const lista = ordenados(visibles());
  const pos = lista.findIndex(x => x.codigo === codigo);
  const hist = (reg.historial || []).slice(0, 8);

  el('drawer-body').innerHTML = `
    <header class="drawer-head">
      <div>
        <span class="code">Tipo equipo ${c.codigo}</span>
        <h2 id="case-name">${esc(c.equipo)}</h2>
        <div>${chip(c.resultado)}</div>
      </div>
      <button type="button" class="icon-btn" data-cerrar aria-label="Cerrar ficha">×</button>
    </header>

    <div class="drawer-scroll">
      <p class="hint"><b>Acción sugerida:</b> ${esc(c.accionSugerida)}. <span class="muted">${esc(r.ayuda)}</span></p>

      <div class="compare">
        <section>
          <h3>Plan CTAR</h3>
          <dl>
            <div><dt>Cantidad</dt><dd>${int(c.plan)}</dd></div>
            <div><dt>Situación</dt><dd>${dato(c.estadoCtar)}</dd></div>
            <div><dt>Valor proyectado</dt><dd>${c.uf != null ? 'UF ' + uf(c.uf) : '—'}</dd></div>
            <div><dt>Año i b)</dt><dd>${dato(c.anioIb)}</dd></div>
          </dl>
        </section>
        <section>
          <h3>Registro del Hospital</h3>
          <dl>
            <div><dt>Cantidad</dt><dd>${int(c.hospital)}</dd></div>
            <div><dt>Estado</dt><dd>${dato(c.estadoHospital)}</dd></div>
            <div class="wide"><dt>Respaldo</dt><dd>${dato(c.detalleHospital)}</dd></div>
          </dl>
        </section>
      </div>

      <details class="more">
        <summary>Antecedentes técnicos y financieros</summary>
        <dl class="facts">
          <div><dt>EETT del Hospital</dt><dd>${dato(c.eettHospital)}</dd></div>
          <div><dt>EETT aprobada por CTAR</dt><dd>${dato(c.eettCtar)}</dd></div>
          <div><dt>Grupo CTAR 131</dt><dd>${dato(c.ctar131)}</dd></div>
          <div><dt>Incorporación</dt><dd>${dato(c.anioIncorporacion)}</dd></div>
          <div><dt>Valor unitario</dt><dd>${c.ufUnitario != null ? 'UF ' + uf(c.ufUnitario) : '—'}</dd></div>
          <div><dt>Financiamiento</dt><dd>${dato(c.financiamiento)}</dd></div>
          <div><dt>Tipo de compra</dt><dd>${dato(c.tipoCompra)}</dd></div>
          <div><dt>Responsable sugerido</dt><dd>${dato(c.responsableSugerido)}</dd></div>
        </dl>
      </details>

      ${puedeEditar() ? `<div class="form-actions"><button type="button" class="btn btn-ghost" data-editar-equipo>Editar datos del equipo</button></div>` : ''}

      <form class="manage-form" id="manage-form" autocomplete="off">
        <h3>Seguimiento</h3>
        ${puedeEditar() ? '' : '<p class="hint">Su perfil es de solo lectura. Puede consultar el seguimiento, pero no modificarlo.</p>'}
        ${reg.actualizadoPor ? `<p class="muted small">Última actualización: ${fechaHora(reg.actualizado)} por ${esc(reg.actualizadoPor)}.</p>` : ''}
        <fieldset ${puedeEditar() ? '' : 'disabled'}>
        <div class="form-grid">
          <label class="field"><span>Estado de gestión</span>
            <select name="estado">${ESTADOS.map((e, i) => `<option value="${esc(e)}"${(reg.estado || ESTADOS[0]) === e ? ' selected' : ''}>${i + 1}. ${esc(e)}</option>`).join('')}</select></label>
          <label class="field"><span>Prioridad</span>
            <select name="prioridad">${PRIORIDADES.map(p => `<option${(reg.prioridad || 'Media') === p ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
          <label class="field"><span>Responsable o instancia</span>
            <input name="responsable" list="instancias" value="${esc(reg.responsable || '')}" placeholder="Ej.: Hospital, CTAR, IF/AIF"></label>
          <label class="field"><span>Plazo</span>
            <input name="fecha" type="date" value="${esc(reg.fecha || '')}"></label>
          <label class="field full"><span>Próxima acción</span>
            <textarea name="accion" rows="3" placeholder="Acción concreta, producto esperado y antecedente requerido">${esc(reg.accion || '')}</textarea></label>
          <label class="field full"><span>Observación de trazabilidad</span>
            <textarea name="nota" rows="3" placeholder="Fuente, acuerdo, oficio o brecha pendiente de validación">${esc(reg.nota || '')}</textarea></label>
        </div>
        <datalist id="instancias">${INSTANCIAS.map(i => `<option value="${esc(i)}">`).join('')}</datalist>
        </fieldset>
        ${puedeEditar() ? `<div class="form-actions">
          <button type="submit" class="btn">Guardar seguimiento</button>
          <button type="button" class="btn btn-ghost" data-limpiar>Limpiar seguimiento</button>
        </div>
        <p class="muted small">Se guarda en el servidor y queda visible para todo el equipo, con su nombre de usuario.</p>` : ''}
      </form>

      ${hist.length ? `<section class="history"><h3>Historial</h3><ol>${hist.map(h => `
        <li><time>${fechaHora(h.t)}${h.usuario ? ' · ' + esc(h.usuario) : ''}</time><span>${esc(h.estado)}${h.responsable ? ' · ' + esc(h.responsable) : ''}</span>${h.accion ? `<em>${esc(h.accion)}</em>` : ''}</li>`).join('')}</ol></section>` : ''}
    </div>

    <footer class="drawer-foot">
      <button type="button" class="btn btn-ghost" data-nav="-1" ${pos <= 0 ? 'disabled' : ''}>Caso anterior</button>
      <span class="muted small">${pos >= 0 ? `${pos + 1} de ${lista.length} en el listado actual` : 'Fuera del listado actual'}</span>
      <button type="button" class="btn btn-ghost" data-nav="1" ${pos < 0 || pos >= lista.length - 1 ? 'disabled' : ''}>Caso siguiente</button>
    </footer>`;
}

function abrirFicha(codigo, disparador) {
  state.abierto = codigo;
  if (disparador) state.disparador = disparador;
  renderFicha(codigo);
  const d = el('drawer');
  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
  el('scrim').hidden = false;
  document.body.classList.add('no-scroll');
  d.querySelector('[data-cerrar]')?.focus();
}

function cerrarFicha() {
  if (state.abierto == null) return;
  state.abierto = null;
  const d = el('drawer');
  d.classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
  el('scrim').hidden = true;
  document.body.classList.remove('no-scroll');
  state.disparador?.isConnected && state.disparador.focus();
}

/* ---------- Avisos, tooltip y exportaciones ---------- */

let toastTimer;
function aviso(texto) {
  const t = el('toast');
  t.textContent = texto;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function mostrarTooltip(tile) {
  const c = state.casos.find(x => String(x.codigo) === tile.dataset.codigo);
  if (!c) return;
  const tip = el('tooltip');
  tip.innerHTML = `<b>${c.codigo} · ${esc(c.equipo)}</b>${chip(c.resultado)}<span>Plan ${int(c.plan)} · Hospital ${int(c.hospital)}</span>`;
  tip.hidden = false;
  const r = tile.getBoundingClientRect(), t = tip.getBoundingClientRect();
  const x = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
  const abajo = r.top < t.height + 16;
  tip.style.left = `${x + window.scrollX}px`;
  tip.style.top = `${(abajo ? r.bottom + 8 : r.top - t.height - 8) + window.scrollY}px`;
}
const ocultarTooltip = () => { el('tooltip').hidden = true; };

function descargarCSV() {
  const regs = store.todos();
  const filas = [[
    'Tipo equipo', 'Equipo', 'Cruce', 'Cantidad Plan', 'Cantidad Hospital', 'Situación CTAR', 'Estado Hospital',
    'Año i b)', 'UF proyectado', 'Gestión', 'Responsable', 'Plazo', 'Prioridad', 'Próxima acción', 'Observación',
  ], ...ordenados(visibles()).map(c => {
    const g = regs[c.codigo] || {};
    return [c.codigo, c.equipo, c.resultado, c.plan ?? '', c.hospital ?? '', c.estadoCtar, c.estadoHospital,
      c.anioIb, c.uf ?? '', g.estado || ESTADOS[0], g.responsable || '', g.fecha || '', g.prioridad || '',
      g.accion || '', g.nota || ''];
  })];
  descargar('reposicion_vu_hfbc.csv', csv(filas), 'text/csv;charset=utf-8');
}

/* ---------- Eventos ---------- */

function enlazarEventos() {
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('#modal')) return void atenderModal(e);
    const tile = t.closest('.tile, .prio, tr[data-codigo], .card');
    if (tile && !t.closest('.card')?.classList.contains('dragging')) {
      return abrirFicha(Number(tile.dataset.codigo), tile);
    }
    const leyenda = t.closest('.legend-item');
    if (leyenda) {
      const id = leyenda.dataset.resultado;
      return aplicarFiltro({ resultado: state.filtros.resultado === id ? '' : id });
    }
    const barra = t.closest('.bar');
    if (barra) {
      const v = barra.dataset.ctar;
      return aplicarFiltro({ ctar: state.filtros.ctar === v ? '' : v }, { irAGestion: true });
    }
    const paso = t.closest('.step');
    if (paso) {
      const v = paso.dataset.gestion;
      return aplicarFiltro({ gestion: state.filtros.gestion === v ? '' : v });
    }
    const orden = t.closest('[data-orden]');
    if (orden) {
      const k = orden.dataset.orden;
      state.orden = { clave: k, dir: state.orden.clave === k ? -state.orden.dir : 1 };
      return renderGestion();
    }
    if (t.closest('#btn-all-gaps')) return aplicarFiltro({ resultado: BRECHA }, { irAGestion: true });
    if (t.closest('#btn-clear')) return aplicarFiltro({ q: '', resultado: '', ctar: '', anio: '', gestion: '' });
    if (t.closest('#btn-csv')) return descargarCSV();
    if (t.closest('#btn-new')) return abrirEquipo(null);
    if (t.closest('#btn-admin')) return admin.abrirAdmin(state.usuario);
    if (t.closest('#btn-account')) return sesion.abrirCuenta(state.usuario);
    if (t.closest('#btn-logout')) return void sesion.salir().then(() => location.reload());
    if (t.closest('[data-editar-equipo]')) return abrirEquipo(state.casos.find(c => c.codigo === state.abierto));
    if (t.closest('#btn-present')) return alternarProyeccion();
    if (t.closest('[data-cerrar]') || t.id === 'scrim') return cerrarFicha();
    const nav = t.closest('[data-nav]');
    if (nav) {
      const lista = ordenados(visibles());
      const i = lista.findIndex(c => c.codigo === state.abierto) + Number(nav.dataset.nav);
      if (lista[i]) { state.abierto = lista[i].codigo; renderFicha(state.abierto); el('drawer-body').querySelector('.drawer-scroll').scrollTop = 0; }
      return;
    }
    if (t.closest('[data-limpiar]') && state.abierto != null) {
      if (confirm('¿Eliminar el seguimiento registrado para esta tipología?')) {
        store.limpiar(state.abierto).then(() => aviso('Seguimiento limpiado')).catch(fallo);
      }
    }
  });

  el('f-q').addEventListener('input', e => aplicarFiltro({ q: e.target.value }));
  el('f-result').addEventListener('change', e => aplicarFiltro({ resultado: e.target.value }));
  el('f-ctar').addEventListener('change', e => aplicarFiltro({ ctar: e.target.value }));
  el('f-year').addEventListener('change', e => aplicarFiltro({ anio: e.target.value }));

  for (const id of ['tab-table', 'tab-board']) {
    el(id).addEventListener('click', () => {
      state.vista = id === 'tab-table' ? 'tabla' : 'tablero';
      el('tab-table').setAttribute('aria-selected', String(state.vista === 'tabla'));
      el('tab-board').setAttribute('aria-selected', String(state.vista === 'tablero'));
      el('view-table').hidden = state.vista !== 'tabla';
      el('view-board').hidden = state.vista !== 'tablero';
      renderGestion();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarFicha();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-codigo], .card')) {
      e.preventDefault();
      abrirFicha(Number(e.target.dataset.codigo), e.target);
    }
    if (e.key === 'Tab' && state.abierto != null && !modal.abierto()) atraparFoco(e);
  });

  el('drawer').addEventListener('submit', async e => {
    e.preventDefault();
    if (!puedeEditar()) return;
    const datos = Object.fromEntries(new FormData(e.target));
    try {
      const cambio = await store.guardar(state.abierto, {
        estado: datos.estado, prioridad: datos.prioridad, responsable: datos.responsable.trim(),
        fecha: datos.fecha, accion: datos.accion.trim(), nota: datos.nota.trim(),
      });
      aviso(cambio ? 'Seguimiento guardado' : 'Sin cambios que guardar');
    } catch (err) { fallo(err); }
  });

  el('modal').addEventListener('submit', async e => {
    if (await sesion.manejarEnvio(e, state.usuario, u => { state.usuario = u; aplicarUsuario(); }, aviso)) return;
    if (await admin.manejarEnvio(e, aviso)) return;
    if (e.target.id === 'form-equipo') { e.preventDefault(); guardarEquipo(e.target); }
  });
  el('modal').addEventListener('change', e => { admin.manejarEnvio(e, aviso); });

  // Tooltip de casillas
  const mapa = el('tilemap');
  mapa.addEventListener('mouseover', e => e.target.closest('.tile') && mostrarTooltip(e.target.closest('.tile')));
  mapa.addEventListener('focusin', e => e.target.closest('.tile') && mostrarTooltip(e.target.closest('.tile')));
  mapa.addEventListener('mouseleave', ocultarTooltip);
  mapa.addEventListener('focusout', ocultarTooltip);

  // Arrastrar y soltar en el tablero
  const tablero = el('board');
  tablero.addEventListener('dragstart', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', card.dataset.codigo);
    e.dataTransfer.effectAllowed = 'move';
  });
  tablero.addEventListener('dragend', e => setTimeout(() => e.target.closest?.('.card')?.classList.remove('dragging'), 0));
  tablero.addEventListener('dragover', e => {
    const col = e.target.closest('.col');
    if (!col) return;
    e.preventDefault();
    tablero.querySelectorAll('.col.over').forEach(c => c !== col && c.classList.remove('over'));
    col.classList.add('over');
  });
  tablero.addEventListener('drop', async e => {
    const col = e.target.closest('.col');
    if (!col) return;
    e.preventDefault();
    if (!puedeEditar()) return;
    const codigo = Number(e.dataTransfer.getData('text/plain'));
    if (store.estadoDe(codigo) !== col.dataset.estado) {
      try {
        await store.guardar(codigo, { estado: col.dataset.estado });
        aviso(`Caso ${codigo} movido a «${col.dataset.estado}»`);
      } catch (err) { fallo(err); }
    } else {
      renderGestion();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) salirProyeccion();
  });
}

/* ---------- Equipos y ventanas ---------- */

const fallo = err => aviso(err.message || 'No se pudo completar la operación.');

function aplicarUsuario() {
  const u = state.usuario;
  el('user-name').textContent = u.nombre;
  el('user-role').textContent = sesion.ROLES[u.rol];
  el('btn-new').hidden = !puedeEditar();
  el('btn-admin').hidden = !esAdmin();
}

function abrirEquipo(caso) {
  if (!puedeEditar()) return;
  modal.abrir({
    titulo: caso ? `Editar equipo ${caso.codigo}` : 'Agregar equipo',
    ancho: 'lg',
    cuerpo: formularioEquipo(state.casos, caso) + (caso && esAdmin()
      ? `<div class="peligro"><p class="small muted">Eliminar quita el equipo del cruce. Queda registrado en la auditoría.</p>
         <button type="button" class="btn btn-ghost btn-peligro" data-eliminar-equipo="${caso.codigo}">Eliminar equipo</button></div>` : ''),
  });
}

function reemplazarEquipo(eq) {
  const i = state.casos.findIndex(c => c.codigo === eq.codigo);
  if (i >= 0) state.casos[i] = eq; else state.casos.push(eq);
  poblarFiltros();
}

async function guardarEquipo(form) {
  const error = el('form-equipo-error');
  error.hidden = true;
  const cuerpo = leerFormulario(form);
  const codigo = form.dataset.codigo;
  try {
    const r = codigo
      ? await llamar('PUT', `/equipos/${codigo}`, { ...cuerpo, version: Number(form.dataset.version) })
      : await llamar('POST', '/equipos', cuerpo);
    reemplazarEquipo(r.equipo);
    modal.cerrar();
    aviso(codigo ? 'Equipo actualizado' : `Equipo ${r.equipo.codigo} agregado`);
    renderTodo();
  } catch (err) {
    if (err.estado === 409 && err.extra.actual) { reemplazarEquipo(err.extra.actual); renderTodo(); }
    error.textContent = err.message;
    error.hidden = false;
  }
}

async function atenderModal(e) {
  if (await sesion.manejarClick(e, state.usuario)) return;
  if (await admin.manejarClick(e, aviso)) return;
  const del = e.target.closest('[data-eliminar-equipo]');
  if (del && confirm(`¿Eliminar el equipo ${del.dataset.eliminarEquipo} del cruce?`)) {
    try {
      await llamar('DELETE', `/equipos/${del.dataset.eliminarEquipo}`);
      state.casos = state.casos.filter(c => String(c.codigo) !== del.dataset.eliminarEquipo);
      modal.cerrar();
      cerrarFicha();
      poblarFiltros();
      renderTodo();
      aviso('Equipo eliminado');
    } catch (err) { fallo(err); }
  }
}

function atraparFoco(e) {
  const foco = [...el('drawer').querySelectorAll('button, input, select, textarea, summary, [tabindex="0"]')]
    .filter(n => !n.disabled && n.offsetParent !== null);
  if (!foco.length) return;
  const primero = foco[0], ultimo = foco[foco.length - 1];
  if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

/* ---------- Modo proyección ---------- */

function alternarProyeccion() {
  if (document.body.classList.contains('present')) {
    if (document.fullscreenElement) document.exitFullscreen(); else salirProyeccion();
    return;
  }
  document.body.classList.add('present');
  el('btn-present').textContent = 'Salir de proyección';
  el('btn-present').setAttribute('aria-pressed', 'true');
  window.scrollTo({ top: 0 });
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function salirProyeccion() {
  document.body.classList.remove('present');
  el('btn-present').textContent = 'Modo proyección';
  el('btn-present').setAttribute('aria-pressed', 'false');
}

/* ---------- Inicio y sesión ---------- */

let eventosListos = false;
let reingresando = false;
let ultimaCarga = 0;

async function cargarTodo() {
  await Promise.all([store.iniciar(), cargar()]);
  ultimaCarga = Date.now();
  poblarFiltros();
  aplicarUsuario();
  el('app').hidden = false;
  if (!eventosListos) {
    eventosListos = true;
    store.suscribir(renderTodo);
  }
  renderTodo();
}

async function entrar(usuario, aviso) {
  state.usuario = usuario || await sesion.pedirIngreso(aviso);
  if (state.usuario.debeCambiarClave) {
    await sesion.exigirCambioClave(state.usuario);
    state.usuario.debeCambiarClave = false;
  }
  try {
    await cargarTodo();
  } catch (err) {
    el('app').hidden = false;
    el('overview-title').textContent = 'No se pudieron cargar los datos del cruce.';
    el('overview-sub').textContent = `${err.message} Actualice la página; si el problema continúa, avise a la Subdirección de Recursos Físicos y Financieros.`;
  }
}

// Si la sesión vence, se vuelve a pedir el ingreso sin perder el lugar.
async function reingresar(mensaje) {
  if (reingresando) return;
  reingresando = true;
  cerrarFicha();
  modal.cerrar();
  state.filtros = { q: '', resultado: '', ctar: '', anio: '', gestion: '' };
  await entrar(null, mensaje);
  reingresando = false;
}

// Trae los cambios de otras personas cuando la ventana está en uso y no hay nada abierto.
async function refrescar() {
  if (reingresando || !state.usuario || document.hidden || state.abierto != null || modal.abierto()) return;
  if (Date.now() - ultimaCarga < 45_000) return;
  try {
    await Promise.all([store.recargar({ notificar: false }), cargar()]);
    ultimaCarga = Date.now();
    poblarFiltros();
    renderTodo();
  } catch { /* se reintenta en el próximo ciclo */ }
}

async function iniciar() {
  modal.iniciarModal();
  enlazarEventos();
  enExpiracion(() => reingresar('Su sesión expiró. Ingrese nuevamente.'));
  let usuario = null;
  try {
    usuario = (await llamar('GET', '/me')).usuario;
  } catch (err) {
    if (err.estado !== 401) {
      el('app').hidden = false;
      el('overview-title').textContent = 'No se pudo conectar con el servidor.';
      el('overview-sub').textContent = err.message;
      return;
    }
  }
  await entrar(usuario);
  setInterval(refrescar, 60_000);
  document.addEventListener('visibilitychange', refrescar);
}

iniciar();
