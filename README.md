# Estado de Situación HFBC

Repositorio del Servicio de Salud Metropolitano Occidente para el seguimiento del
Contrato de Concesión del Hospital Dr. Félix Bulnes Cerda.

## Tablero «Reposición por Vida Útil» (Vercel)

Sitio estático en `public/`, sin Python ni paso de compilación:

- `index.html`: estructura de la página.
- `assets/app.js`, `config.js`, `store.js`, `format.js`: lógica del tablero (módulos ES).
- `assets/styles.css`: estilos, modo proyección e impresión.
- `assets/data.json`: cruce de las 117 tipologías (Plan CTAR vs. registro del Hospital).
- `assets/logo-ssmocc.png`: logo institucional.

Qué hace: muestra el cruce con una casilla por tipología, prioriza las brechas y permite
gestionar cada caso (estado, responsable, plazo, próxima acción, historial) en la misma
página, en vista de tabla o tablero. El seguimiento se guarda en el navegador; para compartirlo
entre personas se usa «Exportar seguimiento» e «Importar seguimiento» (archivo JSON).

Para actualizar el cruce basta reemplazar `public/assets/data.json` y publicar en `main`.
Prueba local: `cd public && python3 -m http.server 8000`.

Vercel publica solo `public/` (ver `vercel.json` y `.vercelignore`).

## Presentación ejecutiva (Streamlit)

`app.py`, `actualizaciones.py` y `Presentacion_HFBC_actualizada_23-07-2026.html.html`
siguen intactos y se publican en Streamlit Cloud desde `main`. Cada antecedente nuevo debe
registrar materia, fuente y fecha, hecho acreditado, estado de validación, próximo paso y
responsable. Los borradores y propuestas no se presentan como acuerdos definitivos.
