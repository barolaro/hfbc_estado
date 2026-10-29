import { esc } from './format.js';
import { RESULTADOS } from './config.js';

// Resultado del cruce que corresponde a las cantidades registradas.
export function resultadoSugerido(plan, hospital) {
  if (plan == null && hospital == null) return null;
  if (plan != null && hospital == null) return 'Solo plan CTAR';
  if (plan == null && hospital != null) return 'Solo registro Hospital';
  return plan === hospital ? 'Coincide cantidad' : 'Diferencia de cantidad';
}

const num = v => (v == null ? '' : String(v));

function campo(nombre, etiqueta, valor, { tipo = 'text', lista = '', requerido = false, ancho = '', ayuda = '' } = {}) {
  const extra = tipo === 'number' ? ' step="any" min="0" inputmode="decimal"' : ' maxlength="500"';
  return `<label class="field ${ancho}"><span>${esc(etiqueta)}${requerido ? ' *' : ''}</span>
    <input name="${nombre}" type="${tipo}" value="${esc(valor)}"${extra}${lista ? ` list="${lista}"` : ''}${requerido ? ' required' : ''}>
    ${ayuda ? `<small class="muted">${esc(ayuda)}</small>` : ''}</label>`;
}

function opciones(casos, clave) {
  return [...new Set(casos.map(c => c[clave]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
    .map(v => `<option value="${esc(v)}">`).join('');
}

export function formularioEquipo(casos, c = null) {
  const nuevo = !c;
  const v = c || {};
  // Si el resultado actual es el que dan las cantidades, queda en automático para que siga a los cambios.
  const auto = !v.resultado || v.resultado === resultadoSugerido(v.plan ?? null, v.hospital ?? null);
  const sel = RESULTADOS.map(r => `<option value="${esc(r.id)}"${!auto && v.resultado === r.id ? ' selected' : ''}>${esc(r.etiqueta)}</option>`).join('');
  return `<form id="form-equipo" autocomplete="off" data-version="${v.version ?? ''}" data-codigo="${v.codigo ?? ''}">
    <div class="form-grid">
      ${nuevo ? campo('codigo', 'Tipo equipo (código)', '', { tipo: 'number', requerido: true }) : ''}
      ${campo('equipo', 'Nombre del equipo', v.equipo, { requerido: true, ancho: nuevo ? '' : 'full' })}
      ${campo('plan', 'Cantidad en Plan CTAR', num(v.plan), { tipo: 'number', ayuda: 'Déjelo vacío si el Plan no incluye la tipología.' })}
      ${campo('hospital', 'Cantidad en registro Hospital', num(v.hospital), { tipo: 'number', ayuda: 'Déjelo vacío si el Hospital no la registra.' })}
      <label class="field full"><span>Resultado del cruce</span>
        <select name="resultado"><option value="">Según las cantidades (automático)</option>${sel}</select>
        <small class="muted">Use “Decisión alineada” solo cuando exista respaldo de la decisión CTAR.</small></label>
      ${campo('estadoCtar', 'Situación CTAR', v.estadoCtar, { lista: 'dl-estadoCtar' })}
      ${campo('estadoHospital', 'Estado en el Hospital', v.estadoHospital, { lista: 'dl-estadoHospital' })}
      ${campo('detalleHospital', 'Respaldo del Hospital (oficio, fecha)', v.detalleHospital, { ancho: 'full' })}
    </div>
    <details class="more"><summary>Antecedentes técnicos y financieros</summary>
      <div class="form-grid">
        ${campo('uf', 'UF proyectado', num(v.uf), { tipo: 'number' })}
        ${campo('ufUnitario', 'Valor unitario (UF)', num(v.ufUnitario), { tipo: 'number' })}
        ${campo('cantidadFinal', 'Cantidad final', num(v.cantidadFinal), { tipo: 'number' })}
        ${campo('anioIb', 'Año i b)', v.anioIb, { lista: 'dl-anioIb' })}
        ${campo('anioIncorporacion', 'Incorporación', v.anioIncorporacion)}
        ${campo('financiamiento', 'Financiamiento', v.financiamiento, { lista: 'dl-financiamiento' })}
        ${campo('tipoCompra', 'Tipo de compra', v.tipoCompra)}
        ${campo('ctar131', 'Grupo CTAR 131', v.ctar131)}
        ${campo('eettHospital', 'EETT del Hospital', v.eettHospital)}
        ${campo('eettCtar', 'EETT aprobada por CTAR', v.eettCtar)}
        ${campo('responsableSugerido', 'Responsable sugerido', v.responsableSugerido, { lista: 'dl-responsableSugerido' })}
        ${campo('accionSugerida', 'Acción sugerida', v.accionSugerida, { lista: 'dl-accionSugerida', ancho: 'full' })}
      </div>
    </details>
    ${['estadoCtar', 'estadoHospital', 'anioIb', 'financiamiento', 'responsableSugerido', 'accionSugerida']
      .map(k => `<datalist id="dl-${k}">${opciones(casos, k)}</datalist>`).join('')}
    <p class="form-error" id="form-equipo-error" role="alert" hidden></p>
    <div class="form-actions">
      <button type="submit" class="btn">${nuevo ? 'Agregar equipo' : 'Guardar cambios'}</button>
      <button type="button" class="btn btn-ghost" data-modal-cerrar>Cancelar</button>
    </div>
  </form>`;
}

// Convierte el formulario en el cuerpo que espera la API.
export function leerFormulario(form) {
  const d = Object.fromEntries(new FormData(form));
  const n = k => (d[k] === '' || d[k] == null ? null : Number(d[k]));
  const t = k => String(d[k] ?? '').trim();
  const plan = n('plan'), hospital = n('hospital');
  const cuerpo = {
    equipo: t('equipo'), plan, hospital,
    resultado: d.resultado || resultadoSugerido(plan, hospital) || 'Solo plan CTAR',
    estadoCtar: t('estadoCtar'), estadoHospital: t('estadoHospital'), detalleHospital: t('detalleHospital'),
    uf: n('uf'), ufUnitario: n('ufUnitario'), cantidadFinal: n('cantidadFinal'),
    anioIb: t('anioIb'), anioIncorporacion: t('anioIncorporacion'), financiamiento: t('financiamiento'),
    tipoCompra: t('tipoCompra'), ctar131: t('ctar131'), eettHospital: t('eettHospital'), eettCtar: t('eettCtar'),
    responsableSugerido: t('responsableSugerido'), accionSugerida: t('accionSugerida'),
  };
  if (d.codigo !== undefined) cuerpo.codigo = Number(d.codigo);
  return cuerpo;
}
