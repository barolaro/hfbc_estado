// Cliente de la API. Las cookies de sesión son HttpOnly: el código no maneja claves ni tokens.

export class ErrorApi extends Error {
  constructor(estado, mensaje, extra = {}) {
    super(mensaje);
    this.estado = estado;
    this.extra = extra;
  }
}

let alExpirar = () => {};
export const enExpiracion = fn => { alExpirar = fn; };

export async function llamar(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: { 'X-Solicitud': 'tablero' }, credentials: 'same-origin', cache: 'no-store' };
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  let resp;
  try {
    resp = await fetch(`/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revise su red e intente de nuevo.');
  }
  let datos = null;
  try { datos = await resp.json(); } catch { /* respuesta sin cuerpo */ }
  if (!resp.ok) {
    const { error, ...extra } = datos || {};
    if (resp.status === 401 && !['/login', '/me'].includes(ruta) && !extra.requiereCodigo) alExpirar();
    throw new ErrorApi(resp.status, error || 'No se pudo completar la operación.', extra);
  }
  return datos;
}
