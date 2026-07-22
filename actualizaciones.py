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
        ('data-t="Operación hoy: 9 materias"', 'data-t="Operación hoy: 10 materias"'),
        ("Nueve Materias Críticas, Todas con Gestión Trazada", "Diez Materias Relevantes, Todas con Gestión Trazada"),
        ("actualizado al 20 de julio de 2026.", "actualizado al 22 de julio de 2026."),
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
        (
            '<div class="ac-body"><div class="pensar"><b>En otras palabras:</b> es la asignación de inversión de cada año. Existen años de baja exigencia — el Año 7 contempla solo UF 510 — y años de renovación masiva, como el Año 10, que contempla UF 673.575.</div><p>El <b>VMA</b> (Valor Máximo de Adquisición) es el presupuesto tope de cada año para comprar y reponer según el Anexo I. El plan del Año 7 aprobado en el Acta N.° 148 totaliza UF 136.413,57. El <b>borrador del Acta N.° 149</b> lo actualiza a <b>UF 144.538,29</b>, incorporando 42 unidades de mobiliario de hospitalización eléctrico cuya adquisición no debe postergarse. Esta actualización queda sujeta a la aprobación y firma del acta.</p><span class="dato">Acta N.° 148: UF 136.413,57 · Borrador Acta N.° 149: UF 144.538,29</span></div>',
            '<div class="ac-body"><div class="pensar"><b>En otras palabras:</b> el VMRI se mantiene en UF 144.538,29 mientras las 42 camas continúen incorporadas en el plan del séptimo Año de Explotación. Priorizar inicialmente 10 unidades no reduce por sí solo la cantidad total programada.</div><p>El <b>VMA</b> (Valor Máximo de Adquisición) corresponde al límite contractual programado en el Anexo I. El <b>VMRI</b> (Valor Máximo Revisado de Inversión) refleja el total actualizado del plan anual. El plan aprobado mediante el Acta N.° 148 totaliza <b>UF 136.413,57</b>; el <b>borrador del Acta N.° 149</b> propone <b>UF 144.538,29</b> e incorpora 42 camas eléctricas de hospitalización. La propuesta de iniciar la gestión con 10 unidades mantiene las 32 restantes dentro de la programación y no altera el VMRI, siempre que el CTAR no modifique la cantidad total. Si el plan se redujera a solo 10 camas, correspondería recalcular la categoría d); el acta no informa el valor unitario necesario para determinar ese nuevo total. La ejecución por etapas dentro del mismo año requiere confirmación previa del Inspector Fiscal y aprobación del CTAR.</p><span class="dato">42 camas en el plan · inicio propuesto: 10 · saldo programado: 32 · VMRI: UF 144.538,29 · criterio pendiente de validación IF/CTAR</span></div>',
        ),
        (
            '<div class="clave"><div class="n">Plan Año 7</div><p><b>Actualización en revisión:</b> el plan aprobado en el Acta N.° 148 totaliza UF 136.413,57. El borrador del Acta N.° 149 lo eleva a <b>UF 144.538,29</b> al reincorporar 42 unidades de mobiliario de hospitalización eléctrico, señalando que las adquisiciones programadas en el Anexo I no deben postergarse.</p></div>',
            '<div class="clave"><div class="n">Plan Año 7</div><p><b>Actualización en revisión:</b> el borrador del Acta N.° 149 propone un VMRI de <b>UF 144.538,29</b> e incorpora 42 camas eléctricas. Se plantea iniciar la gestión con 10 unidades, manteniendo las 32 restantes dentro de la programación. El valor se mantiene mientras no se reduzca la cantidad total; la ejecución por etapas debe ser confirmada por el Inspector Fiscal y acordada por el CTAR.</p></div>',
        ),
    ]

    for anterior, nuevo in cambios:
        html = _reemplazar(html, anterior, nuevo)
    return html
