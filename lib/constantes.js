// Constantes compartidas por la API. Deben coincidir con public/assets/config.js.

export const ROLES = ['admin', 'editor', 'lector'];

export const ESTADOS = [
  'Sin iniciar', 'En conciliación', 'En revisión CTAR',
  'Derivado a IF/DGC', 'En ejecución', 'Cerrado con respaldo',
];
export const PRIORIDADES = ['Alta', 'Media', 'Baja'];

export const RESULTADOS = [
  'Coincide cantidad', 'Decisión alineada', 'Diferencia de cantidad',
  'Solo plan CTAR', 'Solo registro Hospital',
];

// Campos de un equipo (tipología) y su tipo. Todo lo demás se rechaza.
export const CAMPOS_EQUIPO = {
  equipo: 'texto', resultado: 'resultado', plan: 'numero', hospital: 'numero',
  estadoCtar: 'texto', estadoHospital: 'texto', detalleHospital: 'texto',
  uf: 'numero', ufUnitario: 'numero', anioIb: 'texto', anioIncorporacion: 'texto',
  eettHospital: 'texto', eettCtar: 'texto', ctar131: 'texto',
  financiamiento: 'texto', tipoCompra: 'texto', cantidadFinal: 'numero',
  responsableSugerido: 'texto', accionSugerida: 'texto',
};

export const SESION_MAX_HORAS = 12;
export const SESION_INACTIVIDAD_MIN = 60;
export const INTENTOS_USUARIO = 5;
export const INTENTOS_IP = 25;
export const VENTANA_BLOQUEO_MIN = 15;
