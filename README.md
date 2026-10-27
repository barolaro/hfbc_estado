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

**27 de octubre de 2026 — Presentación ejecutiva CTAR para MINSAL**

La presentación fue reducida a ocho láminas para explicar el CTAR a una
audiencia no especializada. Cruza los Ordinarios HFB N.° 1085 y N.° 0172, las
planillas de adquisiciones, reposiciones y SIC, y los acuerdos consignados en
la minuta interinstitucional del 26 de octubre de 2026. Las cifras se presentan
como universos distintos y sujetos a conciliación documental.

## Despliegue

La aplicación se publica desde la rama `main` mediante Streamlit Cloud,
utilizando `app.py` como archivo principal.
