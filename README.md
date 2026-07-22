# Estado de Situación HFBC — repositorio oficial

Repositorio oficial de la presentación ejecutiva del Contrato de Concesión del
Hospital Dr. Félix Bulnes Cerda, elaborada para el seguimiento institucional del
Servicio de Salud Metropolitano Occidente.

## Arquitectura

- `app.py`: publicación y configuración de la aplicación Streamlit.
- `Estado_Situacion_HFBC.html`: presentación ejecutiva autónoma.
- `actualizaciones.py`: capa trazable para incorporar nuevos antecedentes sin
  reconstruir el archivo maestro.
- `requirements.txt`: dependencias de ejecución.

## Criterio de actualización

Cada antecedente nuevo debe registrar, como mínimo:

1. materia;
2. fuente y fecha;
3. hecho acreditado;
4. estado de validación;
5. próximo paso;
6. responsable o instancia competente.

Los borradores, correos y propuestas no deben presentarse como acuerdos
definitivos. Las obligaciones contractuales y las decisiones del CTAR deben
distinguirse de los antecedentes técnicos y de la coordinación institucional.

## Última actualización

**22 de julio de 2026 — Radiocomunicaciones HFBC**

La visita técnica del 1 de julio de 2026 recomendó elevar al menos seis metros
la antena HF utilizando los soportes existentes. La observación inicialmente
informada respecto de la antena VHF fue dejada sin efecto, por corresponder a
otro establecimiento. El próximo paso es formalizar el requerimiento mediante
ordinario a la Inspección Fiscal y solicitar información sobre su programación.

## Despliegue

La aplicación se publica desde la rama `main` mediante Streamlit Cloud,
utilizando `app.py` como archivo principal.
