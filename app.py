"""
Estado de Situación HFBC — envoltura Streamlit
Contrato de Concesión · Hospital Clínico Félix Bulnes Cerda (SSMOCC)

Muestra la presentación ejecutiva completa (HTML autónomo con Chart.js y su
propia función "Actualizar presentación") a pantalla completa dentro de Streamlit.
"""

from pathlib import Path

import streamlit as st

st.set_page_config(
    page_title="Estado de Situación HFBC",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Quitar cromo de Streamlit y márgenes para que la presentación ocupe todo el ancho.
st.markdown(
    """
    <style>
      #MainMenu, footer, header[data-testid="stHeader"] {visibility:hidden; height:0;}
      .block-container {padding:0 !important; max-width:100% !important;}
      [data-testid="stAppViewContainer"] > .main {padding:0 !important;}
      div[data-testid="stVerticalBlock"] {gap:0 !important;}
      iframe {border:0 !important;}
    </style>
    """,
    unsafe_allow_html=True,
)

HTML_FILE = Path(__file__).parent / "Estado_Situacion_HFBC.html"

# Preferimos st.iframe (API vigente, sirve el HTML desde un origen real, lo que
# hace más confiable el guardado de la función "Actualizar"). Si la versión de
# Streamlit no lo tuviera, caemos a components.html como respaldo.
try:
    st.iframe(HTML_FILE, height=900)
except Exception:
    import streamlit.components.v1 as components
    components.html(HTML_FILE.read_text(encoding="utf-8"), height=900, scrolling=True)
