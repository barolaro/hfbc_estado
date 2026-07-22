"""Actualizaciones institucionales trazables de la presentación HFBC."""

FECHA_CORTE = "22 de julio de 2026"


def _reemplazar(html: str, anterior: str, nuevo: str) -> str:
    """Aplica un cambio solo cuando el texto base esperado está presente."""
    if anterior not in html:
        return html
    return html.replace(anterior, nuevo, 1)


def aplicar_actualizaciones(html: str) -> str:
    """Incorpora antecedentes validados sin modificar el HTML maestro."""
    cambios = [
        (
            'data-t="Operación hoy: 9 materias"',
            'data-t="Operación hoy: 10 materias"',
        ),
        (
            "Nueve Materias Críticas, Todas con Gestión Trazada",
            "Diez Materias Relevantes, Todas con Gestión Trazada",
        ),
        (
            "actualizado al 20 de julio de 2026.",
            "actualizado al 22 de julio de 2026.",
        ),
        (
            '<tr class="fila"><td>Filtraciones agua lluvia</td>',
            '<tr class="fila"><td>Radiocomunicaciones · Antena HF</td><td class="det">Visita técnica recomienda elevar la antena al menos seis metros utilizando los soportes existentes</td><td><span class="pill media">MEDIA</span></td><td><span class="pill gestion">POR FORMALIZAR</span></td><td class="chev">＋</td></tr>\n'
            '      <tr class="exp"><td colspan="5"><b>Antecedentes:</b> visita técnica realizada el 01.07.2026 en la cubierta de la Torre B · <b>recomendación confirmada:</b> elevar al menos seis metros la antena HF utilizando los soportes actualmente instalados · <b>precisión:</b> la observación inicialmente informada sobre el cable de la antena VHF fue dejada sin efecto por corresponder a otro establecimiento · <b>próximo paso:</b> formalizar el requerimiento mediante ordinario a la Inspección Fiscal y solicitar información sobre su programación.</td></tr>\n'
            '      <tr class="fila"><td>Filtraciones agua lluvia</td>',
        ),
        (
            "sesión CTAR N.° 149 realizada el 15.07.2026: su borrador actualiza el Plan Año 7",
            "el borrador del Acta CTAR N.° 149 actualiza el Plan Año 7",
        ),
    ]

    for cambio in cambios:
        if len(cambio) == 2:
            html = _reemplazar(html, cambio[0], cambio[1])
        else:
            html = _reemplazar(html, cambio[0], "".join(cambio[1:]))
    return html
