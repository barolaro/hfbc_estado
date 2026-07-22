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
            '<div class="ac-body"><div class="pensar"><b>En otras palabras:</b> la versión revisada del plan considerará 10 camas eléctricas de hospitalización, no 42. Por ello, el VMRI debe recalcularse antes de cerrar el Acta N.° 149.</div><p>El <b>VMA</b> (Valor Máximo de Adquisición) corresponde al límite contractual programado en el Anexo I, mientras que el <b>VMRI</b> refleja el total actualizado del plan anual. El Acta N.° 148 registra un total aprobado de <b>UF 136.413,57</b>. La cifra de <b>UF 144.538,29</b> incluida en una versión previa del borrador del Acta N.° 149 fue calculada considerando 42 camas; por tanto, deja de representar el plan revisado si se incorporan únicamente 10. El nuevo total debe ser recalculado por la Inspección Fiscal, actualizando la categoría d) con el valor correspondiente a las 10 unidades. Las 32 camas restantes quedarán fuera de esta versión del plan y deberán ser evaluadas y programadas posteriormente, conforme a los antecedentes técnicos, asistenciales, financieros y contractuales, sin desconocer la necesidad asistencial informada por el Hospital.</p><span class="dato">Plan revisado: 10 camas · 32 fuera de esta versión · VMRI pendiente de recálculo y validación IF/CTAR</span></div>',
        ),
        (
            '<div class="clave"><div class="n">Plan Año 7</div><p><b>Actualización en revisión:</b> el plan aprobado en el Acta N.° 148 totaliza UF 136.413,57. El borrador del Acta N.° 149 lo eleva a <b>UF 144.538,29</b> al reincorporar 42 unidades de mobiliario de hospitalización eléctrico, señalando que las adquisiciones programadas en el Anexo I no deben postergarse.</p></div>',
            '<div class="clave"><div class="n">Plan Año 7</div><p><b>Actualización en revisión:</b> la versión ajustada considerará <b>10 camas eléctricas de hospitalización</b>. Las otras 32 quedarán fuera de esta versión del plan y serán objeto de evaluación y programación posterior. La cifra de UF 144.538,29 correspondía al escenario de 42 camas; el <b>nuevo VMRI está pendiente de recálculo</b> por la Inspección Fiscal y de validación por el CTAR.</p></div>',
        ),
    ]

    for anterior, nuevo in cambios:
        html = _reemplazar(html, anterior, nuevo)
    return html
