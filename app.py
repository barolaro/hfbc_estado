"""
Repositorio Ejecutivo HFBC — versión Streamlit
Contrato de Concesión · Hospital Clínico Félix Bulnes Cerda
Servicio de Salud Metropolitano Occidente (SSMOCC)

Reproduce en Python/Streamlit la aplicación original (Next.js + Cloudflare):
tablero ejecutivo, modo presentación, repositorio documental con buscador
y formulario para incorporar antecedentes.
"""

import json
from datetime import datetime
from html import escape
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("America/Santiago")
except Exception:
    TZ = None

import streamlit as st

# --------------------------------------------------------------------------- #
#  Configuración y rutas
# --------------------------------------------------------------------------- #
BASE = Path(__file__).parent
DATA_FILE = BASE / "data" / "documents.json"
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

USER = {"name": "Bayron Retamal", "email": "retamal.ingeniero@gmail.com"}

MESES = ["ene", "feb", "mar", "abr", "may", "jun",
         "jul", "ago", "sep", "oct", "nov", "dic"]
MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

SLIDES = [
    {"kicker": "Situación contractual",
     "title": "Un contrato exigente, con control institucional",
     "body": "La información contractual, financiera y operacional se consolida en un repositorio único. Cada cifra conserva su fuente, fecha y estado de validación.",
     "stat": "Fecha de corte automática"},
    {"kicker": "Riesgo financiero",
     "title": "UF 457.891 de brecha proyectada",
     "body": "La mayor presión se concentra en los años de renovación masiva. Los fondos confirmados alcanzan UF 417.677 y requieren una estrategia contractual trazable.",
     "stat": "91% cubierto por fondos confirmados"},
    {"kicker": "Operación hospitalaria",
     "title": "Nueve materias críticas en seguimiento",
     "body": "Climatización, esterilización, equipamiento clínico, agua caliente, filtraciones, RFID, equipos TI, sistemas clínicos y ropería se gestionan con responsable y próximo hito.",
     "stat": "5 de prioridad alta"},
    {"kicker": "CTAR",
     "title": "Sesión N.° 149 realizada",
     "body": "El borrador actualiza el Plan del Año 7 a UF 144.538,29, reincorpora 42 camas eléctricas y registra 17 bajas prioritarias. Sus acuerdos siguen pendientes de aprobación y firma.",
     "stat": "Acta N.° 149 · borrador"},
    {"kicker": "Climatización",
     "title": "Auditoría externa solicitada y materia escalada",
     "body": "El Hospital solicitó una auditoría técnica independiente y MINSAL requirió a la DGC informar gestiones y evaluar mitigaciones mientras se aborda la causa estructural.",
     "stat": "DGC requerida · 02.07.2026"},
    {"kicker": "Decisión",
     "title": "El valor está en controlar el dato",
     "body": "El repositorio convierte oficios, actas, correos y antecedentes técnicos en una línea de tiempo verificable para decidir, escalar y presentar con respaldo.",
     "stat": "Fuente visible en cada actualización"},
]

# --------------------------------------------------------------------------- #
#  Datos (persistencia en archivo JSON)
# --------------------------------------------------------------------------- #
def load_docs():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_docs(docs):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)


if "docs" not in st.session_state:
    st.session_state.docs = load_docs()
if "view" not in st.session_state:
    st.session_state.view = "resumen"
if "slide" not in st.session_state:
    st.session_state.slide = 0
if "notice" not in st.session_state:
    st.session_state.notice = ""

# --------------------------------------------------------------------------- #
#  Utilidades
# --------------------------------------------------------------------------- #
def now_cutoff():
    dt = datetime.now(TZ) if TZ else datetime.now()
    return f"{dt.day} de {MESES_LARGO[dt.month - 1]} de {dt.year}, {dt:%H:%M}"


def fmt_date(v):
    if not v:
        return "—"
    try:
        y, m, d = v.split("-")
        return f"{int(d):02d} {MESES[int(m) - 1]} {y}"
    except Exception:
        return v


def status_class(status):
    return status.split(" ")[0].lower()


def type_icon(t):
    t = t.lower()
    if "acta" in t:
        return "A"
    if "oficio" in t or "ordinario" in t:
        return "O"
    if "correo" in t:
        return "@"
    if "bali" in t or "contrato" in t:
        return "§"
    return "D"


def extract_number(title):
    import re
    m = re.search(r"\d{2,3}", title)
    return m.group(0) if m else "149"


def sorted_docs(docs):
    return sorted(docs, key=lambda d: (d.get("documentDate", ""), d.get("id", 0)), reverse=True)


# --------------------------------------------------------------------------- #
#  Estilos (paleta y componentes del diseño original)
# --------------------------------------------------------------------------- #
st.set_page_config(page_title="Repositorio Ejecutivo HFBC",
                   page_icon="🏥", layout="wide",
                   initial_sidebar_state="expanded")

CSS = """
<style>
:root{--navy:#071a2e;--navy2:#0d2b48;--blue:#1572c4;--cyan:#5fc8ea;
--red:#dd3d32;--amber:#d99a2b;--green:#2e9568;--ink:#172332;--muted:#657587;
--line:#dce5ed;--paper:#f3f6f9;--white:#fff}

/* Lienzo general */
.stApp{background:var(--paper);}
.block-container{padding-top:1.1rem;padding-bottom:2.5rem;max-width:1460px;}
#MainMenu,footer,header[data-testid="stHeader"]{visibility:hidden;height:0;}
html,body,[class*="css"]{font-family:Arial,Helvetica,sans-serif;color:var(--ink);}

/* Barra superior */
.topbar{background:var(--navy);color:#fff;display:flex;align-items:center;
padding:16px 26px;border-radius:14px;margin-bottom:20px;
border:1px solid #1f3e5a;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:40px;height:40px;border-radius:12px;
background:linear-gradient(135deg,var(--blue),var(--cyan));display:grid;
place-items:center;font-weight:900;letter-spacing:-1px;font-size:15px;}
.brand b{font-size:15px;display:block;}
.brand small{display:block;color:#91a8bd;font-size:10px;margin-top:3px;letter-spacing:.04em;}
.live-date{margin-left:auto;margin-right:24px;font-size:11px;color:#a9bbcb;}
.live-date b{color:#fff;font-weight:600;}
.pulse{display:inline-block;width:7px;height:7px;border-radius:50%;
background:#45d492;margin-right:8px;box-shadow:0 0 0 5px rgba(69,212,146,.12);}
.user-chip{display:flex;align-items:center;gap:9px;border-left:1px solid #29455f;padding-left:20px;}
.user-chip>span{width:34px;height:34px;border-radius:50%;background:#e9f2fa;
color:var(--blue);font-weight:800;font-size:11px;display:grid;place-items:center;}
.user-chip b{font-size:11px;display:block;}
.user-chip small{font-size:9px;color:#8fa7ba;display:block;margin-top:2px;}

/* Cabecera de página */
.eyebrow{font-size:9px;letter-spacing:.14em;color:var(--blue);font-weight:800;
text-transform:uppercase;margin:0 0 8px;}
.page-head h1{font-size:34px;line-height:1.05;margin:0;color:var(--navy);letter-spacing:-.035em;}
.page-head h1 span{color:var(--blue);}
.page-head p{margin:10px 0 0;max-width:720px;color:var(--muted);font-size:13px;line-height:1.6;}

/* Métricas */
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:18px 0 16px;}
.metric{background:#fff;border:1px solid var(--line);border-radius:14px;
padding:18px 19px;position:relative;overflow:hidden;}
.metric:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:var(--blue);}
.metric.red:before{background:var(--red);}.metric.green:before{background:var(--green);}
.metric.amber:before{background:var(--amber);}
.metric small{color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.08em;display:block;}
.metric b{font-size:25px;margin:10px 0 5px;color:var(--navy);letter-spacing:-.04em;display:block;}
.metric.red b{color:var(--red);}.metric.green b{color:var(--green);}.metric.amber b{color:var(--amber);}
.metric span{font-size:9px;color:#8a99a8;display:block;}

/* Tarjetas del tablero */
.dashboard-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:16px;}
.command-card,.activity-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.card-head small{font-size:8px;color:var(--blue);letter-spacing:.11em;font-weight:800;}
.card-head h2{font-size:16px;margin:5px 0 0;color:var(--navy);}
.live-pill{font-size:8px;color:var(--green);background:#eaf6f0;border-radius:20px;padding:5px 9px;font-weight:800;}
.radar-row{display:grid;grid-template-columns:58px 1fr 150px;align-items:center;gap:12px;
padding:14px 0;border-top:1px solid #edf1f5;}
.priority{font-size:8px;font-weight:800;border-radius:5px;padding:5px;text-align:center;text-transform:uppercase;}
.priority.crítica{color:var(--red);background:#fbeceb;}
.priority.alta{color:#a86d0b;background:#fcf2df;}
.radar-row b{font-size:12px;color:var(--navy);}
.radar-row p{font-size:10px;color:var(--muted);line-height:1.45;margin:4px 0 0;}
.radar-row>small{font-size:9px;color:#7e8f9f;text-align:right;}

.timeline>div{position:relative;padding:0 0 15px 22px;border-left:1px solid var(--line);margin-left:4px;}
.timeline>div:last-child{padding-bottom:0;}
.doc-dot{position:absolute;width:9px;height:9px;background:var(--blue);border:2px solid #fff;
box-shadow:0 0 0 1px var(--blue);border-radius:50%;left:-5px;top:2px;}
.doc-dot.borrador,.doc-dot.pendiente{background:var(--amber);box-shadow:0 0 0 1px var(--amber);}
.timeline time{display:block;color:#8796a4;font-size:8px;text-transform:uppercase;}
.timeline b{display:block;color:var(--navy);font-size:10px;margin:4px 0;}
.timeline small{display:block;color:var(--muted);font-size:8px;}

.cutoff-strip{margin-top:16px;background:linear-gradient(100deg,#0a2742,#123c60);
color:#fff;border-radius:13px;padding:15px 18px;display:flex;align-items:center;gap:13px;}
.cutoff-strip>span{color:#45d492;}
.cutoff-strip small{font-size:8px;color:#6fa0c3;letter-spacing:.1em;display:block;}
.cutoff-strip b{font-size:11px;margin-top:3px;display:block;}
.cutoff-strip p{margin-left:auto;font-size:9px;color:#94aec2;margin-bottom:0;}

/* Presentación */
.executive-slide{aspect-ratio:16/9;max-height:640px;
background:radial-gradient(circle at 80% 20%,#144c72 0,#0b2944 30%,#071a2e 72%);
border-radius:18px;color:#fff;padding:6% 7.5%;position:relative;overflow:hidden;
box-shadow:0 24px 60px rgba(7,26,46,.25);}
.executive-slide:after{content:"";position:absolute;width:320px;height:320px;
border:1px solid rgba(95,200,234,.12);border-radius:50%;right:-70px;top:-80px;
box-shadow:0 0 0 70px rgba(95,200,234,.025),0 0 0 140px rgba(95,200,234,.018);}
.slide-accent{width:66px;height:5px;border-radius:3px;
background:linear-gradient(90deg,var(--cyan) 70%,var(--red) 70%);}
.slide-kicker{font-size:10px;letter-spacing:.14em;text-transform:uppercase;
color:#71bde8;font-weight:800;margin:22px 0 13px;}
.executive-slide h1{font-size:clamp(30px,4vw,56px);line-height:1.02;letter-spacing:-.045em;
max-width:900px;margin:0;position:relative;z-index:2;}
.slide-body{font-size:clamp(13px,1.4vw,18px);line-height:1.55;color:#b8c9d7;
max-width:760px;margin:24px 0;position:relative;z-index:2;}
.slide-stat{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);
border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:10px 13px;font-size:11px;}
.slide-stat span{color:#4add9c;}
.slide-footer{position:absolute;left:7.5%;right:7.5%;bottom:5%;
border-top:1px solid rgba(255,255,255,.12);padding-top:13px;display:flex;
justify-content:space-between;color:#7f9bb0;font-size:9px;}
.slide-counter{font-size:10px;color:var(--muted);letter-spacing:.08em;margin-bottom:10px;}

/* Repositorio */
.repo-summary{display:flex;gap:24px;background:#fff;border:1px solid var(--line);
border-radius:11px;padding:12px 16px;margin:14px 0 13px;}
.repo-summary span{font-size:9px;color:var(--muted);}
.repo-summary b{color:var(--navy);font-size:12px;margin-right:5px;}
.document-list{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;}
.document-header,.document-row{display:grid;grid-template-columns:1.55fr 110px 130px .9fr;
gap:12px;align-items:center;}
.document-header{background:#edf3f8;padding:10px 16px;color:#708193;font-size:8px;
text-transform:uppercase;letter-spacing:.08em;font-weight:700;}
.document-row{padding:14px 16px;border-top:1px solid #edf1f4;}
.doc-main{display:flex;gap:12px;align-items:flex-start;}
.doc-main i{font-style:normal;width:32px;height:36px;display:grid;place-items:center;
background:#eaf3fb;color:var(--blue);border-radius:7px;font-weight:900;}
.doc-main b{font-size:11px;color:var(--navy);}
.doc-main p{font-size:9px;color:var(--muted);line-height:1.4;margin:4px 0;}
.doc-main small,.source small{font-size:8px;color:#90a0af;}
.document-row time{font-size:9px;color:var(--muted);}
.status{justify-self:start;padding:5px 8px;border-radius:20px;font-size:8px;
font-weight:800;text-transform:uppercase;}
.status.aprobado{background:#e8f5ef;color:var(--green);}
.status.borrador{background:#fcf0dc;color:#aa6a00;}
.status.en{background:#eaf2fa;color:var(--blue);}
.status.pendiente{background:#fdeceb;color:#b23b30;}
.status.cerrado{background:#eef1f4;color:#5a6b7c;}
.source b{font-size:9px;color:var(--navy);display:block;}
.source small{display:block;}
.empty{padding:40px;text-align:center;color:var(--muted);font-size:11px;}

/* Formulario / copy */
.policy-note{margin-top:22px;border-left:3px solid var(--amber);background:#fff8eb;
padding:13px 15px;border-radius:0 9px 9px 0;}
.policy-note b{font-size:10px;color:#8a590a;}
.policy-note p{font-size:9px;color:#806b48;line-height:1.5;margin:5px 0 0;}
.notice-ok{font-size:11px;line-height:1.5;color:var(--green);background:#e9f6ef;
padding:11px 13px;border-radius:8px;border:1px solid #cfeadd;margin-bottom:10px;}

/* Barra lateral (navegación) */
section[data-testid="stSidebar"]{background:#0b2239;}
section[data-testid="stSidebar"] *{color:#cdd9e5;}
section[data-testid="stSidebar"] .stButton>button{width:100%;text-align:left;
background:transparent;border:0;color:#9fb3c5;padding:10px 12px;border-radius:10px;
font-size:13px;font-weight:600;}
section[data-testid="stSidebar"] .stButton>button:hover{background:#123454;color:#fff;}
.side-title{color:#6f92ad !important;font-size:9px;letter-spacing:.09em;
text-transform:uppercase;margin:4px 0 6px;}
.side-status{background:#0e2b46;border:1px solid #1d405c;border-radius:12px;padding:14px;margin-top:14px;}
.side-status small{color:#6f92ad !important;font-size:8px;letter-spacing:.08em;
text-transform:uppercase;display:block;}
.side-status b{font-size:11px;margin:7px 0;color:#fff !important;display:block;}
.side-status span{font-size:9px;line-height:1.5;color:#91a8bd !important;display:block;}
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)

# --------------------------------------------------------------------------- #
#  Barra superior
# --------------------------------------------------------------------------- #
cutoff = now_cutoff()
initials = "".join(w[0] for w in USER["name"].split()[:2]).upper()
st.markdown(f"""
<div class="topbar">
  <div class="brand">
    <span class="brand-mark">HF</span>
    <span><b>Repositorio Ejecutivo</b>
    <small>Contrato de Concesión · Hospital Félix Bulnes</small></span>
  </div>
  <div class="live-date"><span class="pulse"></span>Fecha de corte: <b>{cutoff}</b></div>
  <div class="user-chip"><span>{initials}</span>
    <div><b>{escape(USER['name'])}</b><small>Acceso privado</small></div>
  </div>
</div>
""", unsafe_allow_html=True)

# --------------------------------------------------------------------------- #
#  Navegación lateral
# --------------------------------------------------------------------------- #
docs = st.session_state.docs
drafts = sum(1 for d in docs if d["status"] == "Borrador")

with st.sidebar:
    st.markdown('<p class="side-title">Navegación</p>', unsafe_allow_html=True)
    if st.button("⌂  Resumen ejecutivo", key="nav_resumen"):
        st.session_state.view = "resumen"
    if st.button("▶  Modo presentación", key="nav_pres"):
        st.session_state.view = "presentacion"
    if st.button(f"▤  Repositorio ({len(docs)})", key="nav_repo"):
        st.session_state.view = "repositorio"
    if st.button("＋  Agregar antecedente", key="nav_add"):
        st.session_state.view = "actualizar"

    plural = "" if drafts == 1 else "es"
    plural2 = "" if drafts == 1 else "s"
    st.markdown(f"""
    <div class="side-status">
      <small>Gobernanza documental</small>
      <b>{drafts} borrador{plural} pendiente{plural2}</b>
      <span>Los borradores nunca se muestran como acuerdos definitivos.</span>
    </div>""", unsafe_allow_html=True)

view = st.session_state.view

# --------------------------------------------------------------------------- #
#  Vista: Resumen ejecutivo
# --------------------------------------------------------------------------- #
def render_resumen():
    ordered = sorted_docs(docs)
    latest_ctar = next((d for d in ordered if "ctar" in (d["documentType"] + d["title"]).lower()), None)
    ctar_num = extract_number(latest_ctar["title"]) if latest_ctar else "149"
    ctar_status = latest_ctar["status"] if latest_ctar else "Borrador"

    st.markdown(f"""
    <div class="page-head">
      <p class="eyebrow">Centro de control institucional</p>
      <h1>Estado de situación <span>vivo</span></h1>
      <p>Una vista ejecutiva alimentada por el repositorio documental.
      Cada actualización deja fecha, fuente y estado.</p>
    </div>
    <div class="metric-grid">
      <div class="metric red"><small>Brecha proyectada</small><b>UF 457.891</b><span>Acta CTAR N.° 141</span></div>
      <div class="metric green"><small>Fondos confirmados</small><b>UF 417.677</b><span>91% de la brecha</span></div>
      <div class="metric amber"><small>Materias críticas</small><b>9</b><span>5 de prioridad alta</span></div>
      <div class="metric"><small>Última sesión CTAR</small><b>{ctar_num}</b><span>{escape(ctar_status)}</span></div>
    </div>
    """, unsafe_allow_html=True)

    timeline_rows = ""
    for d in ordered[:5]:
        cls = status_class(d["status"])
        timeline_rows += f"""<div><span class="doc-dot {cls}"></span>
        <time>{fmt_date(d['documentDate'])}</time>
        <b>{escape(d['title'])}</b>
        <small>{escape(d['documentType'])} · {escape(d['status'])}</small></div>"""
    if not ordered:
        timeline_rows = "<p class='empty'>Agregue el primer antecedente.</p>"

    st.markdown(f"""
    <div class="dashboard-grid">
      <div class="command-card">
        <div class="card-head">
          <div><small>RADAR DE GESTIÓN</small><h2>Materias que requieren conducción</h2></div>
          <span class="live-pill">EN SEGUIMIENTO</span>
        </div>
        <div class="radar-row">
          <span class="priority crítica">Crítica</span>
          <div><b>Sistema de climatización</b><p>Auditoría externa solicitada; MINSAL requirió gestión a la DGC.</p></div>
          <small>Pendiente pronunciamiento DGC</small>
        </div>
        <div class="radar-row">
          <span class="priority alta">Alta</span>
          <div><b>Autoclave 600 litros</b><p>Equipo N.° 90.015 fuera de servicio por fisura en cordón de soldadura.</p></div>
          <small>Seguimiento CTAR / IFE</small>
        </div>
        <div class="radar-row">
          <span class="priority alta">Alta</span>
          <div><b>Plan Año 7</b><p>Borrador CTAR N.° 149 eleva el plan a UF 144.538,29.</p></div>
          <small>Pendiente aprobación del acta</small>
        </div>
      </div>
      <div class="activity-card">
        <div class="card-head"><div><small>TRAZABILIDAD</small><h2>Últimos antecedentes</h2></div></div>
        <div class="timeline">{timeline_rows}</div>
      </div>
    </div>
    <div class="cutoff-strip">
      <span>●</span>
      <div><small>FECHA DE CORTE OFICIAL</small><b>{cutoff}</b></div>
      <p>Esta fecha se actualiza automáticamente al abrir o presentar el repositorio.</p>
    </div>
    """, unsafe_allow_html=True)


# --------------------------------------------------------------------------- #
#  Vista: Modo presentación
# --------------------------------------------------------------------------- #
def render_presentacion():
    i = st.session_state.slide
    s = SLIDES[i]
    st.markdown(f'<div class="slide-counter">HFBC / ESTADO DE SITUACIÓN &nbsp;·&nbsp; '
                f'{i + 1:02d} / {len(SLIDES):02d}</div>', unsafe_allow_html=True)
    st.markdown(f"""
    <div class="executive-slide">
      <div class="slide-accent"></div>
      <p class="slide-kicker">{escape(s['kicker'])}</p>
      <h1>{escape(s['title'])}</h1>
      <p class="slide-body">{escape(s['body'])}</p>
      <div class="slide-stat"><span>◉</span>{escape(s['stat'])}</div>
      <div class="slide-footer">
        <span>Servicio de Salud Metropolitano Occidente</span>
        <b>Fecha de corte: {cutoff}</b>
      </div>
    </div>
    """, unsafe_allow_html=True)

    c1, c2, c3 = st.columns([1, 3, 1])
    with c1:
        if st.button("← Anterior", disabled=(i == 0), use_container_width=True):
            st.session_state.slide = max(0, i - 1)
            st.rerun()
    with c2:
        st.markdown(f"<div style='text-align:center;color:#657587;font-size:11px;"
                    f"padding-top:8px;'>Lámina {i + 1} de {len(SLIDES)}</div>",
                    unsafe_allow_html=True)
    with c3:
        if st.button("Siguiente →", disabled=(i == len(SLIDES) - 1), use_container_width=True):
            st.session_state.slide = min(len(SLIDES) - 1, i + 1)
            st.rerun()


# --------------------------------------------------------------------------- #
#  Vista: Repositorio
# --------------------------------------------------------------------------- #
def render_repositorio():
    st.markdown("""
    <div class="page-head">
      <p class="eyebrow">Biblioteca contractual</p>
      <h1>Repositorio <span>documental</span></h1>
      <p>Actas, ordinarios, correos y antecedentes técnicos con trazabilidad completa.</p>
    </div>
    """, unsafe_allow_html=True)

    query = st.text_input("Buscar", key="repo_query",
                          placeholder="Buscar por número, materia o fuente…",
                          label_visibility="collapsed")
    q = (query or "").lower()
    filtered = [d for d in sorted_docs(docs)
                if q in " ".join([d["title"], d["documentType"], d["summary"],
                                  d["tags"], d["source"]]).lower()]

    aprob = sum(1 for d in filtered if d["status"] == "Aprobado")
    borr = sum(1 for d in filtered if d["status"] == "Borrador")
    st.markdown(f"""
    <div class="repo-summary">
      <span><b>{len(filtered)}</b> antecedentes visibles</span>
      <span><b>{aprob}</b> aprobados</span>
      <span><b>{borr}</b> borradores</span>
    </div>""", unsafe_allow_html=True)

    rows = '<div class="document-header"><span>Documento</span><span>Fecha</span>' \
           '<span>Estado</span><span>Fuente</span></div>'
    if not filtered:
        rows += '<div class="empty">No hay documentos que coincidan con la búsqueda.</div>'
    for d in filtered:
        cls = status_class(d["status"])
        creator = d["createdBy"].split("@")[0]
        file_line = f'<small>📎 {escape(d["fileName"])}</small>' if d.get("fileName") else ""
        rows += f"""
        <div class="document-row">
          <div class="doc-main"><i>{type_icon(d['documentType'])}</i>
            <div><b>{escape(d['title'])}</b><p>{escape(d['summary'])}</p>
            <small>{escape(d['documentType'])} · {escape(d['tags'])}</small></div>
          </div>
          <time>{fmt_date(d['documentDate'])}</time>
          <span class="status {cls}">{escape(d['status'])}</span>
          <div class="source"><b>{escape(d['source'] or 'Antecedente institucional')}</b>
          <small>Incorporado por {escape(creator)}</small>{file_line}</div>
        </div>"""
    st.markdown(f'<div class="document-list">{rows}</div>', unsafe_allow_html=True)


# --------------------------------------------------------------------------- #
#  Vista: Agregar antecedente
# --------------------------------------------------------------------------- #
def render_actualizar():
    st.markdown("""
    <div class="page-head">
      <p class="eyebrow">Actualización inteligente</p>
      <h1>Agregar un nuevo <span>antecedente</span></h1>
      <p>Cada carga actualiza el repositorio, la actividad reciente y la fecha de corte.
      El estado documental evita que un borrador sea presentado como acuerdo definitivo.</p>
    </div>
    <div class="policy-note"><b>Regla de integridad</b>
    <p>"Borrador", "en revisión" y "aprobado" se mantienen separados en toda la herramienta.</p></div>
    """, unsafe_allow_html=True)

    if st.session_state.notice:
        st.markdown(f'<div class="notice-ok">{escape(st.session_state.notice)}</div>',
                    unsafe_allow_html=True)
        st.session_state.notice = ""

    with st.form("add_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            title = st.text_input("Título o número del antecedente",
                                  placeholder="Ej.: Borrador Acta CTAR N.° 150")
            doc_type = st.selectbox("Tipo", ["Acta CTAR", "Ordinario", "Oficio", "Correo",
                                             "Informe técnico", "BALI / Contrato", "Planilla"])
            source = st.text_input("Fuente", placeholder="Hospital, IFE, MINSAL, DGC…")
        with col2:
            doc_date = st.date_input("Fecha del documento", value=datetime.now(TZ) if TZ else datetime.now())
            status = st.selectbox("Estado", ["Borrador", "En revisión", "Aprobado",
                                             "Pendiente de respuesta", "Cerrado"], index=1)
            tags = st.text_input("Etiquetas", placeholder="CTAR, climatización, equipamiento, fondos…")

        summary = st.text_area("Resumen ejecutivo",
                               placeholder="Qué informa, qué solicita, impacto y próximo paso…", height=110)
        upload = st.file_uploader("Documento adjunto (opcional · máx. 20 MB)",
                                  type=["pdf", "doc", "docx", "eml", "msg", "txt", "xlsx"])
        submitted = st.form_submit_button("Incorporar y actualizar  →", use_container_width=True)

    if submitted:
        if not title.strip() or not summary.strip():
            st.error("Título y resumen son obligatorios.")
            return
        file_name = None
        if upload is not None:
            if upload.size > 20 * 1024 * 1024:
                st.error("El archivo supera el máximo de 20 MB.")
                return
            file_name = upload.name
            try:
                (UPLOAD_DIR / file_name).write_bytes(upload.getbuffer())
            except Exception:
                pass
        new_id = (max([d["id"] for d in docs]) + 1) if docs else 1
        docs.append({
            "id": new_id,
            "title": title.strip(),
            "documentType": doc_type,
            "documentDate": doc_date.strftime("%Y-%m-%d"),
            "status": status,
            "summary": summary.strip(),
            "source": source.strip(),
            "tags": tags.strip(),
            "fileName": file_name,
            "createdBy": USER["email"],
            "createdAt": datetime.now(TZ).isoformat() if TZ else datetime.now().isoformat(),
        })
        save_docs(docs)
        st.session_state.docs = docs
        st.session_state.notice = ("Antecedente incorporado. El repositorio y la presentación "
                                   "ya reflejan la nueva fecha de corte.")
        st.session_state.view = "repositorio"
        st.rerun()


# --------------------------------------------------------------------------- #
#  Enrutamiento
# --------------------------------------------------------------------------- #
if view == "resumen":
    render_resumen()
elif view == "presentacion":
    render_presentacion()
elif view == "repositorio":
    render_repositorio()
elif view == "actualizar":
    render_actualizar()
