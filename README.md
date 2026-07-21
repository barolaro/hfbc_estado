# Repositorio Ejecutivo HFBC — Streamlit

Versión en Python/Streamlit del *Repositorio Ejecutivo* del Contrato de Concesión
del Hospital Clínico Félix Bulnes Cerda (SSMOCC). Reproduce las cuatro vistas de
la aplicación original: **resumen ejecutivo**, **modo presentación** (6 láminas),
**repositorio documental** con buscador, y **formulario para incorporar antecedentes**.

## Archivos

```
app.py                  → aplicación Streamlit
requirements.txt        → dependencias (streamlit)
data/documents.json     → repositorio inicial (6 antecedentes de ejemplo)
uploads/                → carpeta donde caen los archivos adjuntos
README.md
```

## Cómo subirlo (sin terminal)

1. En GitHub: **Add file → Upload files**. Arrastre `app.py`, `requirements.txt`,
   el `README.md` y **la carpeta `data`** (con su `documents.json` dentro).
   Commit.
2. En Streamlit Cloud (share.streamlit.io): **Create app → Deploy from GitHub**,
   elija el repositorio, rama `main`, y en *Main file path* escriba `app.py`. Deploy.

## Nota sobre persistencia

Los antecedentes que agregue se guardan en `data/documents.json`. En Streamlit Cloud
ese archivo **se reinicia cuando la app se reinicia o se vuelve a desplegar** (el
disco es efímero). Para almacenamiento durable entre reinicios conviene conectar la
persistencia a la **API de GitHub** —el mismo patrón usado en `ssmoc_td`—, de modo
que cada carga escriba el JSON de vuelta al repositorio. Se puede incorporar como
mejora posterior.
