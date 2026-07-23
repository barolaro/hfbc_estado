"""Estado de Situación HFBC — publicación ejecutiva oficial.

La presentación base se mantiene en Presentacion_HFBC_actualizada_23-07-2026.html y las
novedades institucionales se aplican desde actualizaciones.py. Esta
separación permite mantener trazabilidad y actualizar contenidos sin alterar
la estructura visual completa.
"""

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from actualizaciones import aplicar_actualizaciones

st.set_page_config(
    page_title="Estado de Situación HFBC",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      #MainMenu, footer, header[data-testid="stHeader"] {
        visibility: hidden;
        height: 0;
      }
      .block-container {
        padding: 0 !important;
        max-width: 100% !important;
      }
      [data-testid="stAppViewContainer"] > .main {
        padding: 0 !important;
      }
      div[data-testid="stVerticalBlock"] {
        gap: 0 !important;
      }
      iframe {
        border: 0 !important;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

base_dir = Path(__file__).parent
preferidos = [
    "Presentacion_HFBC_actualizada_23-07-2026.html",
    "Estado_Situacion_HFBC.html",
    "Presentacion_HFBC_actualizada_23-07-2026.html.html",
    "Estado_Situacion_HFBC.html.html",
]

html_file = next(
    (base_dir / nombre for nombre in preferidos if (base_dir / nombre).is_file()),
    None,
)

if html_file is None:
    disponibles = sorted(base_dir.glob("*.html")) + sorted(base_dir.glob("*.html.html"))
    html_file = disponibles[0] if disponibles else None

if html_file is None:
    st.error("No fue posible cargar la presentación: no existe un archivo HTML en el repositorio.")
    st.stop()

html_base = html_file.read_text(encoding="utf-8")
html_actualizado = aplicar_actualizaciones(html_base)

components.html(html_actualizado, height=920, scrolling=True)
