# Estado de Situación HFBC — Streamlit

Publica la presentación ejecutiva del Contrato de Concesión del Hospital Clínico
Félix Bulnes Cerda (SSMOCC) en Streamlit Cloud.

`app.py` incrusta a pantalla completa el archivo `Estado_Situacion_HFBC.html`,
que es una presentación autónoma con sus láminas, gráficos (Chart.js) y su propia
función **"Actualizar presentación"**.

## Archivos

```
app.py                        → envoltura Streamlit
Estado_Situacion_HFBC.html    → la presentación completa
requirements.txt              → streamlit
README.md
```

## Despliegue

1. Suba estos archivos al repositorio `barolaro/hfbc_estado`.
2. En share.streamlit.io → Create app → Deploy from GitHub → rama `main`,
   Main file path = `app.py`.

## Sobre "Actualizar presentación"

La función de actualizar guarda los cambios en el navegador (localStorage) y
permite **descargar/importar** el estado como archivo. Los cambios quedan en el
equipo y navegador donde se editan; para compartirlos, use la opción de descargar
el archivo e importarlo en otro equipo.
