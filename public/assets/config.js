// Definiciones del tablero: resultados del cruce, ruta de gestión y textos.
// Los colores del cruce fueron validados para daltonismo (ver README).

export const RESULTADOS = [
  { id: 'Coincide cantidad',      etiqueta: 'Coinciden en cantidad',  color: '#1a9850', grupo: 'ok',
    ayuda: 'El Plan CTAR y el Hospital registran la misma cantidad.' },
  { id: 'Decisión alineada',      etiqueta: 'Decisión alineada',      color: '#6250d6', grupo: 'ok',
    ayuda: 'Coincide la cantidad y la decisión CTAR está respaldada en el registro del Hospital.' },
  { id: 'Diferencia de cantidad', etiqueta: 'Diferencia de cantidad', color: '#e08a00', grupo: 'brecha',
    ayuda: 'Ambos registran la tipología, pero con cantidades distintas.' },
  { id: 'Solo plan CTAR',         etiqueta: 'Solo en Plan CTAR',      color: '#2a78d6', grupo: 'brecha',
    ayuda: 'El Plan la incluye y el registro del Hospital no.' },
  { id: 'Solo registro Hospital', etiqueta: 'Solo en registro Hospital', color: '#d63a46', grupo: 'brecha',
    ayuda: 'El Hospital la registra y el Plan CTAR no la incluye.' },
];

export const RESULTADO_POR_ID = Object.fromEntries(RESULTADOS.map(r => [r.id, r]));

// Ruta de gestión: es una secuencia real, por eso se numera.
export const ESTADOS = [
  'Sin iniciar',
  'En conciliación',
  'En revisión CTAR',
  'Derivado a IF/DGC',
  'En ejecución',
  'Cerrado con respaldo',
];

export const PRIORIDADES = ['Alta', 'Media', 'Baja'];

export const INSTANCIAS = ['Hospital', 'CTAR', 'IF/AIF', 'DGC', 'SSMOCC', 'MINSAL', 'Concesionaria'];

export const STORAGE_KEY = 'hfbc-vu-gestion-v2';
export const STORAGE_KEY_V1 = 'hfbc-reposicion-vu-gestion-v1';

// Estados del registro v1 (versión anterior del tablero) -> estados actuales.
export const MIGRACION_ESTADOS = {
  'Pendiente de antecedentes': 'Sin iniciar',
  'En conciliación': 'En conciliación',
  'En revisión CTAR': 'En revisión CTAR',
  'Derivado a Inspección Fiscal': 'Derivado a IF/DGC',
  'En ejecución': 'En ejecución',
  'Cerrado con respaldo': 'Cerrado con respaldo',
};
