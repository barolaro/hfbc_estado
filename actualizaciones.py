"""Capa editorial para la presentación HFBC dirigida a MINSAL.

Actualiza textos y estados sin modificar la estructura, estilos ni número de
láminas del HTML maestro.
"""

import re

FECHA_CORTE = "12 de agosto de 2026"


def _reemplazar(html: str, anterior: str, nuevo: str) -> str:
    """Reemplaza una coincidencia cuando el texto base está disponible."""
    return html.replace(anterior, nuevo, 1) if anterior in html else html


def _reemplazar_variantes(html: str, variantes: tuple[str, ...], nuevo: str) -> str:
    """Permite mantener compatibilidad con distintas versiones del HTML."""
    for anterior in variantes:
        if anterior in html:
            return html.replace(anterior, nuevo, 1)
    return html


def aplicar_actualizaciones(html: str) -> str:
    """Orienta la presentación a decisión y articulación institucional MINSAL."""
    # Portada y relato ejecutivo.
    html = _reemplazar_variantes(
        html,
        (
            "Hospital Félix Bulnes: Estado de Situación y Plan de Trabajo Conjunto",
            "Hospital Félix Bulnes:<br><em>Estado de Situación y Plan de Trabajo Conjunto</em>",
        ),
        "Hospital Félix Bulnes: Gestión Conjunta para Anticipar Riesgos y Acelerar Decisiones",
    )
    html = _reemplazar(
        html,
        "Estado de Situación y Plan de Trabajo Conjunto",
        "Prioridades, Riesgos y Decisiones",
    )
    html = re.sub(
        r"(Hospital Félix Bulnes:\s*(?:<br\s*/?>)?\s*<em[^>]*>).*?(</em>)",
        r"\1Prioridades, Riesgos y Decisiones\2",
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = _reemplazar_variantes(
        html,
        (
            "Contrato de concesión, prioridades asistenciales y seguimiento de materias operacionales.",
            "Contrato de concesión, salud financiera y operación de los servicios concesionados.",
        ),
        "Prioridades asistenciales, sostenibilidad del equipamiento y decisiones que requieren articulación MINSAL–SSMOCC.",
    )
    html = _reemplazar_variantes(
        html,
        (
            "Mesa de trabajo Hospital–Servicio · Julio 2026.",
            "Presentación ejecutiva interactiva para la Dirección del Servicio · Julio 2026.",
        ),
        "Presentación ejecutiva para MINSAL · 13 de agosto de 2026.",
    )

    # Láminas de síntesis y gobernanza.
    html = _reemplazar(html, "El Panorama en 30 Segundos", "Tres Mensajes para la Decisión Institucional")
    html = _reemplazar(html, 'data-t="Panorama en 30 segundos"', 'data-t="Tres mensajes para decisión"')
    html = _reemplazar(
        html,
        "Una visión compartida del contrato, las prioridades asistenciales y las materias que requieren coordinación para avanzar con oportunidad y trazabilidad.",
        "El SSMOCC cuenta con una cartera priorizada y trazable; el riesgo financiero principal es futuro y cuantificado; y existen decisiones específicas que requieren articulación con MINSAL, la Inspección Fiscal y la DGC.",
    )
    html = _reemplazar(
        html,
        "La oportunidad: estos antecedentes permiten acordar prioridades con el Hospital, ordenar los responsables y anticipar las decisiones que deberán gestionarse ante el CTAR, la Inspección Fiscal, la DGC y MINSAL.",
        "Objetivo de esta reunión: concordar prioridades, responsables y próximos hitos, resguardando las competencias del CTAR y de la Inspección Fiscal y fortaleciendo el acompañamiento de MINSAL en las materias que requieren escalamiento.",
    )
    html = _reemplazar(
        html,
        "estos antecedentes permiten acordar prioridades con el Hospital, ordenar los responsables y anticipar las decisiones que deberán gestionarse ante el CTAR, la Inspección Fiscal, la DGC y MINSAL.",
        "concordar prioridades, responsables y próximos hitos, fortaleciendo el acompañamiento de MINSAL en las materias que requieren escalamiento y resguardando las competencias del CTAR y de la Inspección Fiscal.",
    )
    html = _reemplazar(
        html,
        "y fue esta institución la que lo detectó, con la anticipación necesaria para gestionarlo.",
        "y el SSMOCC lo sistematizó con la anticipación necesaria para preparar su gestión institucional.",
    )
    html = _reemplazar(html, "Cómo Funciona la Concesión del Hospital", "Gobernanza del Contrato: Quién Decide y Quién Destraba")
    html = _reemplazar(
        html,
        "Cinco actores, un contrato. Toque cada actor para ver su rol, su dato clave y qué le pide hoy el Servicio.",
        "Cinco actores con competencias diferenciadas. La propuesta del SSMOCC es ordenar el conducto regular, evitar duplicidades y escalar oportunamente las decisiones que exceden el ámbito local.",
    )

    # Estado financiero: lenguaje estratégico y no alarmista.
    html = _reemplazar(html, "El Costo Proyectado ya Supera el Tope del Contrato", "Riesgo Financiero Cuantificado: Existe Ventana para Actuar")
    html = _reemplazar(
        html,
        "La propia Inspección Fiscal cuantificó que el costo total del ciclo supera el presupuesto máximo contractual. No es un déficit de caja: es un límite legal que, sin gestión, compromete la reposición de equipamiento crítico.",
        "La proyección informada por la Inspección Fiscal supera el presupuesto máximo contractual. El Hospital opera actualmente; el riesgo se concentra en reposiciones futuras y permite preparar desde ahora una estrategia contractual, financiera y asistencial.",
    )
    html = _reemplazar(html, "Los Fondos Cubren el 91% — con Condiciones de Uso", "Cobertura Potencial del 91% — Sujeta a Reglas de Uso")
    html = _reemplazar(
        html,
        "Brecha no cubierta. Y la advertencia central: ninguno de los dos fondos existe para financiar el programa ordinario del Anexo I. Aplicarlos al déficit requiere habilitación contractual — y esa gestión es exactamente la que está en curso con la Inspección Fiscal.",
        "Brecha residual estimada: UF 40.213. Los fondos no son de libre disposición y su aplicación debe ajustarse al contrato. Se propone solicitar una definición formal de la ruta aplicable antes de comprometer usos o fuentes de financiamiento.",
    )
    html = _reemplazar(html, "Lo Más Exigente del Contrato Todavía no Ocurre", "La Mayor Exigencia se Concentra en los Años 8 y 10")

    # Cartera operativa y actualización CTAR 150.
    html = _reemplazar_variantes(
        html,
        (
            "Diez Materias Prioritarias, Todas con Gestión Trazada",
            "Diez Materias Relevantes, Todas con Gestión Trazada",
            "Nueve Materias Críticas, Todas con Gestión Trazada",
        ),
        "Cartera Priorizada: Avances, Brechas y Próximo Hito",
    )
    html = _reemplazar_variantes(
        html,
        (
            "actualizado al 20 de julio de 2026.",
            "actualizado al 22 de julio de 2026.",
            "actualizado al 23 de julio de 2026.",
        ),
        f"actualizado al {FECHA_CORTE}.",
    )
    html = _reemplazar(html, "actualización 22 jul 2026", "actualización 12 ago 2026")
    html = _reemplazar(
        html,
        "operacionales prioritarias en gestión: 5 de prioridad alta, todas con trazabilidad y responsable",
        "prioridades operacionales con trazabilidad; incluye reposiciones CTAR y nuevas materias recibidas del Hospital",
    )
    html = _reemplazar(
        html,
        "<b>actualización CTAR N.° 149:</b>",
        "<b>actualización CTAR N.° 149 y N.° 150:</b>",
    )
    html = _reemplazar(
        html,
        "el borrador registra 17 bajas prioritarias, la aprobación de EETT del hervidor industrial 60.045 y certificados de no objeción para mobiliario bariátrico y UCI",
        "el Acta N.° 149 formalizó bajas y antecedentes técnicos; posteriormente, el Acta N.° 150 (30.07.2026) autorizó excepcionalmente el CNO para la oferta Marsol de los hervidores industriales 60.045 y acordó emitir CNO para ofertas de reposición de delantales plomados",
    )
    html = _reemplazar(
        html,
        "<b>actualización del borrador CTAR N.° 149:</b> registra 17 bajas prioritarias; aprueba las EETT y las bajas de inventario de los <b>tres hervidores industriales 60.045</b>; y consigna certificados de no objeción para mobiliario bariátrico y UCI",
        "<b>avance acreditado:</b> el Acta N.° 149 formalizó las bajas y EETT de los tres hervidores industriales 60.045. En la Sesión N.° 150, de 30.07.2026, el CTAR solicitó autorización excepcional y la Inspección Fiscal autorizó emitir CNO a la oferta Marsol; además, el Comité acordó CNO para ofertas de reposición de delantales plomados",
    )
    html = _reemplazar(
        html,
        " · <b>hervidores:</b> la Inspección Fiscal informó que el 21.07.2026 solicitó a la Sociedad Concesionaria los antecedentes para continuar la reposición, con cinco días para responder. Ese plazo corresponde a la entrega de antecedentes, no a la disponibilidad de los equipos · <b>cautela:</b> los acuerdos se consideran provisionales mientras el acta no se encuentre aprobada y firmada.",
        " · <b>próximo paso:</b> continuar la tramitación posterior al CNO por el conducto contractual y solicitar a la Inspección Fiscal el hito estimado de disponibilidad de los equipos.",
    )
    html = _reemplazar(html, ">SEGUIMIENTO CTAR<", ">ANTECEDENTES EN REVISIÓN<")

    # Cartera actualizada: reposiciones CTAR y nuevo ordinario de calzado.
    html = _reemplazar(html, "<td>Equipamiento clínico</td>", "<td>Reposiciones CTAR y vestuario</td>")
    html = _reemplazar(
        html,
        "Fallas recurrentes, reparaciones lentas y reposiciones pendientes",
        "Hervidores y delantales plomados con avances CTAR · Ord. HFB N.° 1117 sobre calzado en análisis",
    )
    html = _reemplazar(html, ">EN SEGUIMIENTO<", ">AVANCES / REVISIÓN<")
    html = re.sub(
        r'<tr class="exp"><td colspan="5"><b>Gestión:</b> doble vía — seguimiento por CTAR de cada solicitud.*?</td></tr>',
        '<tr class="exp"><td colspan="5">'
        '<b>Hervidores industriales 60.045:</b> el Acta CTAR N.° 149 formalizó las EETT y bajas de tres unidades. En la Sesión N.° 150, de 30.07.2026, la Inspección Fiscal autorizó excepcionalmente emitir CNO a la oferta Marsol; corresponde continuar la tramitación contractual posterior y solicitar el hito estimado de disponibilidad. · '
        '<b>Delantales plomados:</b> las bajas individualizadas fueron aprobadas en CTAR N.° 149 y sus reposiciones revisadas en CTAR N.° 150; existen CNO emitidos o firmados para continuar las etapas siguientes. · '
        '<b>Calzado institucional:</b> el Ord. HFB N.° 1117, recibido el 12.08.2026, solicita revisar antecedentes asociados a uniformes 2020–2021 y convalidación de calzado. Estado: análisis técnico-contractual para preparar respuesta a la Inspección Fiscal, sin pronunciamiento definitivo a esta fecha.'
        '</td></tr>',
        html,
        count=1,
        flags=re.DOTALL,
    )
    html = _reemplazar(html, ">ORDINARIO EN ELABORACIÓN<", ">RECOMENDACIÓN FORMALIZADA<")
    html = _reemplazar(
        html,
        "<b>próximo paso:</b> confeccionar el ordinario dirigido a la Inspección Fiscal y remitir previamente el borrador a Héctor Orrego para su revisión y visto bueno.",
        "<b>estado:</b> recomendación técnica formalizada mediante el Ord. N.° 0896, considerando únicamente elevar al menos seis metros la antena HF con los soportes existentes · <b>próximo paso:</b> solicitar programación y seguimiento por el conducto contractual.",
    )

    # Refuerza la actualización 2026 en la cronología sin crear una nueva lámina.
    html = _reemplazar(
        html,
        "registro de 17 bajas prioritarias y actualización de los representantes del Servicio.",
        "registro de bajas prioritarias y actualización de los representantes del Servicio · CTAR N.° 150: CNO excepcional Marsol para hervidores y avance de CNO de delantales plomados · recepción del Ord. HFB N.° 1117 sobre calzado para análisis técnico-contractual.",
    )
    html = _reemplazar(
        html,
        "aprobación de EETT y bajas de tres hervidores industriales, certificados de no objeción para mobiliario bariátrico y UCI, y actualización de los representantes del Servicio.",
        "aprobación de EETT y bajas de tres hervidores industriales, certificados de no objeción para mobiliario bariátrico y UCI y actualización de representantes · CTAR N.° 150: CNO excepcional Marsol para hervidores y avance de reposición de delantales plomados · Ord. HFB N.° 1117 sobre calzado en análisis.",
    )

    # Casos que necesitan apoyo de nivel central.
    html = _reemplazar(html, "Cuatro Casos donde la Llave la Tienen Terceros", "Cuatro Materias que Requieren Articulación de Nivel Central")
    html = _reemplazar(html, 'data-t="Casos en manos de terceros"', 'data-t="Articulación de nivel central"')
    html = _reemplazar(
        html,
        "En estos casos, el avance requiere pronunciamientos o decisiones de la DGC, MINSAL o de la gobernanza del contrato. La coordinación Hospital–Servicio permite sostener la prioridad y reforzar su seguimiento.",
        "El SSMOCC ha levantado y formalizado los antecedentes disponibles. El avance requiere pronunciamientos o decisiones fuera de su competencia directa; por ello se propone acordar con MINSAL un mecanismo de escalamiento y seguimiento de hitos.",
    )
    html = _reemplazar(
        html,
        "En términos simples:</b> los antecedentes principales ya fueron levantados y existen gestiones institucionales en curso. El objetivo de esta mesa es validar la prioridad asistencial, completar eventuales brechas y mantener un seguimiento conjunto hasta obtener respuesta.",
        "En términos simples:</b> no se solicita sustituir a la Inspección Fiscal ni a la DGC. Se solicita reforzar la priorización sectorial, completar brechas de antecedentes y mantener seguimiento conjunto hasta obtener decisiones formales.",
    )

    # Respuesta institucional del SSMOCC.
    html = _reemplazar(html, "Control del Dato, Formalización y Trazabilidad", "Respuesta del SSMOCC: Control, Priorización y Trazabilidad")
    html = _reemplazar(
        html,
        "La respuesta institucional no ha sido esperar: ha sido reconstruir la información, formalizar cada materia y dejar cada gestión con respaldo documental verificable.",
        "El SSMOCC consolidó información dispersa, formalizó los principales riesgos y estructuró una cartera con responsable, estado y próximo hito. La prioridad ahora es transformar esa trazabilidad en decisiones oportunas y verificables.",
    )

    # Estado de implementación de los instrumentos remitidos al Hospital.
    html = _reemplazar(
        html,
        "La Formalización, Materializada: Nueve Instrumentos",
        "Nueve Instrumentos: Estado de Implementación y Gestión",
    )
    html = _reemplazar(
        html,
        "Ordinarios de la Dirección del Servicio elaborados entre mayo y junio de 2026, que convierten los hallazgos y lecciones de este período en procedimientos, mecanismos de control y gestiones formales permanentes.",
        "Instrumentos formalizados por la Dirección del Servicio: 2 implementados por el Hospital, 4 pendientes de implementación o respuesta y 3 casos que continúan en gestión ante las instancias competentes.",
    )
    implementados = (
        "Control, resguardo, traslado y devolución de equipamiento concesionado",
        "Coordinación institucional y conductos regulares",
    )
    for titulo in implementados:
        html = _reemplazar(
            html,
            f'<div class="k azul">Procedimiento</div><h3>{titulo}</h3>',
            f'<div class="k verde">✓ IMPLEMENTADO</div><h3><span style="color:#16835f">✓</span> {titulo}</h3>',
        )

    pendientes_hospital = (
        "Modificaciones de contrato: procedimiento y requisitos",
        "Consolidación y control de gastos por incumplimientos",
        "Levantamiento y consolidación de antecedentes de explotación",
        "Sumarios administrativos y resguardo del equipamiento",
    )
    for titulo in pendientes_hospital:
        html = re.sub(
            rf'<div class="k (?:azul|verde)">(?:Procedimiento|Control y datos)</div><h3>{re.escape(titulo)}</h3>',
            f'<div class="k">PENDIENTE HOSPITAL</div><h3>{titulo}</h3>',
            html,
            count=1,
        )
    html = _reemplazar(
        html,
        'data-t="Nueve instrumentos institucionales"',
        'data-t="Estado de nueve instrumentos"',
    )

    # Peticiones concretas a MINSAL, sin agregar láminas.
    html = _reemplazar(html, "Seis Acciones para Anticipar los Años 8 y 10", "Hoja de Ruta Propuesta para los Años 8 y 10")
    html = _reemplazar(html, 'data-t="Seis acciones"', 'data-t="Hoja de ruta"')
    html = _reemplazar(
        html,
        "La evidencia no permite afirmar que el contrato sea inviable. Sí obliga a actuar preventivamente — y estas son las acciones concretas.",
        "La evidencia disponible no permite concluir que el contrato sea inviable. Sí justifica una acción preventiva coordinada, con definiciones contractuales, financieras y asistenciales antes de los años de mayor exigencia.",
    )
    html = _reemplazar(html, "Cinco Acuerdos para Convertir el Seguimiento en Avance", "Acuerdos Solicitados a MINSAL: Responsables y Próximos Hitos")
    html = _reemplazar(html, 'data-t="Acuerdos propuestos para la mesa"', 'data-t="Acuerdos solicitados a MINSAL"')
    html = _reemplazar(
        html,
        "La reunión debe finalizar con prioridades compartidas, responsables identificados y un próximo hito verificable para cada materia.",
        "La reunión debe cerrar con definiciones concretas: materia priorizada, responsable institucional, acción siguiente y fecha de revisión. El SSMOCC mantendrá la trazabilidad y reportará los avances por el conducto formal.",
    )
    html = _reemplazar(
        html,
        "una cartera única y priorizada, validada entre el Hospital y el Servicio, que permita llegar al CTAR con antecedentes completos y mantener informado al establecimiento durante toda la tramitación.",
        "una hoja de ruta MINSAL–SSMOCC con responsables y fechas para las reposiciones urgentes, la sostenibilidad financiera y las decisiones pendientes de nivel central.",
    )
    html = _reemplazar(html, "Validar prioridades", "Priorizar reposiciones y materias urgentes")
    html = _reemplazar(
        html,
        "Confirmar cuáles materias requieren atención inmediata por continuidad asistencial, seguridad o impacto operacional.",
        "Confirmar el tratamiento y próximo hito de hervidores, delantales plomados, autoclave de 600 litros y Ord. HFB N.° 1117 sobre calzado.",
    )
    html = _reemplazar(html, "Completar antecedentes", "Definir la ruta financiera de los Años 8 y 10")
    html = _reemplazar(
        html,
        "Identificar EETT, informes técnicos, inventarios, bajas u otros respaldos pendientes antes de remitir cada caso.",
        "Acordar quién elaborará el escenario de reposiciones, uso permitido de fondos, brecha residual y alternativas que requieran gestión ante DGC, MOP o DIPRES.",
    )
    html = _reemplazar(html, "Asignar responsables", "Acordar escalamiento de decisiones pendientes")
    html = _reemplazar(
        html,
        "Definir un referente del Hospital y uno del Servicio por materia, evitando solicitudes sin seguimiento claro.",
        "Definir la ruta y el hito de seguimiento para línea robótica, Seguridad y Vigilancia, climatización y saldo del Programa Gestión del Cambio.",
    )
    html = _reemplazar(html, "Fijar próximos hitos", "Designar contrapartes MINSAL–SSMOCC")
    html = _reemplazar(
        html,
        "Registrar la acción siguiente, la instancia competente y una fecha de revisión, aun cuando el plazo dependa de terceros.",
        "Nombrar un referente por institución para consolidar antecedentes, coordinar respuestas y evitar solicitudes paralelas o sin seguimiento.",
    )
    html = _reemplazar(html, "Revisión periódica", "Instalar seguimiento ejecutivo mensual")
    html = _reemplazar(
        html,
        "Realizar una revisión mensual de la cartera y utilizar el piloto CTAR como visualización común del estado de avance.",
        "Revisar mensualmente la cartera con semáforo, responsable, acción siguiente y fecha; utilizar el piloto CTAR como apoyo, sin reemplazar actas ni canales formales.",
    )
    html = _reemplazar(html, "Compromiso de información", "Compromiso del SSMOCC: informar y cerrar el ciclo")
    html = _reemplazar(
        html,
        "Mantener al Hospital informado sobre cambios de estado, acuerdos del CTAR, actas firmadas y gestiones posteriores.",
        "Informar al Hospital cada cambio de estado y registrar acuerdo, responsable, documento de respaldo y gestión posterior hasta el cierre de cada materia.",
    )

    # La antigua lámina de prototipo se transforma en un cierre de decisiones
    # para MINSAL. Se conserva el número de láminas y se elimina el enlace al piloto.
    html = _reemplazar(
        html,
        "Prueba Piloto: Seguimiento Institucional del Flujo CTAR",
        "Cinco Definiciones para Salir de la Reunión con una Ruta Clara",
    )
    html = _reemplazar(
        html,
        'data-t="Piloto de seguimiento CTAR"',
        'data-t="Definiciones para decisión"',
    )
    html = _reemplazar(
        html,
        "Respuesta del Servicio · transformación digital",
        "MINSAL–SSMOCC · cierre ejecutivo",
    )
    html = _reemplazar(
        html,
        "Herramienta desarrollada para ordenar y visualizar el avance de las solicitudes remitidas por el Hospital, manteniendo una trazabilidad común para los integrantes del sector Salud.",
        "La reunión será efectiva si cada prioridad queda asociada a una decisión, un responsable institucional y una fecha de revisión verificable.",
    )
    html = _reemplazar(
        html,
        "Propósito: disponer de una visión sencilla, actualizada y compartida del estado de cada materia, anticipar pendientes y facilitar la coordinación previa a las sesiones del Comité.",
        "Regla de cierre: ninguna materia prioritaria queda solamente ‘en seguimiento’; cada una debe salir con una ruta y un próximo hito.",
    )
    html = _reemplazar(
        html,
        "<b>Propósito:</b> disponer de una visión sencilla, actualizada y compartida del estado de cada materia, anticipar pendientes y facilitar la coordinación previa a las sesiones del Comité.",
        "<b>Regla de cierre:</b> ninguna materia prioritaria queda solamente ‘en seguimiento’; cada una debe salir con una ruta y un próximo hito.",
    )
    html = _reemplazar(html, "Hospital envía", "Reposiciones críticas")
    html = _reemplazar(
        html,
        "Ingresa la solicitud y sus antecedentes de respaldo.",
        "Definir la ruta de hervidores, delantales plomados, autoclave y calzado.",
    )
    html = _reemplazar(html, "CTAR revisa", "Escenario financiero")
    html = _reemplazar(
        html,
        "Verifica antecedentes técnicos y brechas de información.",
        "Asignar responsable y fecha para proyectar los Años 8 y 10.",
    )
    html = _reemplazar(html, "CTAR acuerda", "Escalamiento sectorial")
    html = _reemplazar(
        html,
        "Registra el pronunciamiento o las acciones pendientes.",
        "Encaminar climatización, línea robótica, seguridad y saldos pendientes.",
    )
    html = _reemplazar(html, "Acta se firma", "Contrapartes designadas")
    html = _reemplazar(
        html,
        "Formaliza el acuerdo adoptado por sus integrantes.",
        "Nombrar referentes MINSAL y SSMOCC para un único canal de seguimiento.",
    )
    html = _reemplazar(html, "Proceso finaliza", "Próxima revisión")
    html = _reemplazar(
        html,
        "Cierra el seguimiento o enlaza la gestión posterior que corresponda.",
        "Acordar fecha, productos esperados y mecanismo de reporte ejecutivo.",
    )
    html = _reemplazar(html, "Valor institucional", "El SSMOCC aporta")
    html = _reemplazar(
        html,
        "Permite informar oportunamente al Hospital, priorizar materias y consolidar una fuente de seguimiento común para Salud.",
        "Diagnóstico, antecedentes, priorización, trazabilidad documental y seguimiento de cada compromiso.",
    )
    html = _reemplazar(html, "Alcance del piloto", "Se solicita a MINSAL")
    html = _reemplazar(
        html,
        "Es una herramienta de apoyo a la gestión. No reemplaza las actas, los antecedentes formales, la SIC ni las competencias del CTAR y de la Inspección Fiscal.",
        "Articulación sectorial, definición de contrapartes y apoyo para encaminar las decisiones que exceden el nivel local.",
    )
    html = re.sub(
        r'<a[^>]+href="https://seguimiento-ctar\.streamlit\.app/?"[^>]*>.*?</a>',
        "",
        html,
        count=1,
        flags=re.DOTALL,
    )

    # Cierre para una reunión con MINSAL.
    html = _reemplazar_variantes(
        html,
        (
            "Una Cartera Exigente, con Prioridades Compartidas y Camino de Avance.",
            "Una Cartera Exigente, <em>con Prioridades Compartidas y Camino de Avance.</em>",
        ),
        "El SSMOCC Llega con Diagnóstico; Hoy Necesitamos Definir la Ruta.",
    )
    html = _reemplazar(
        html,
        "El riesgo financiero mayor está cuantificado, con fuente oficial y años de anticipación",
        "Las reposiciones críticas tienen estado conocido y un próximo paso identificable",
    )
    html = _reemplazar(
        html,
        "Los fondos existen, están confirmados por escrito y su habilitación está en gestión",
        "El riesgo financiero es futuro: debe anticiparse antes de los Años 8 y 10",
    )
    html = _reemplazar(
        html,
        "Cada materia operacional prioritaria cuenta con responsable, estado y próximo paso",
        "Las decisiones fuera del nivel local requieren ruta de escalamiento y fecha",
    )
    html = _reemplazar(
        html,
        "Hospital y Servicio disponen de una base común para validar prioridades y completar antecedentes",
        "MINSAL y SSMOCC necesitan contrapartes identificadas y un canal único",
    )
    html = _reemplazar(
        html,
        "Los acuerdos propuestos permiten llegar mejor preparados al CTAR y mantener una comunicación periódica",
        "El resultado esperado es simple: responsable, acción siguiente y fecha por cada prioridad",
    )
    html = _reemplazar(html, "Fuentes: actas CTAR N°81–148 y borrador Acta N.° 149", "Fuentes: actas CTAR N.° 81–150")
    html = _reemplazar(html, "Fuentes: actas CTAR N°81–148 y borrador Acta N.° 149 revisado al 23.07.2026", "Fuentes: actas CTAR N.° 81–150")
    html = _reemplazar(html, "Fuentes: actas CTAR N.° 81–150 revisado al 23.07.2026", "Fuentes: actas CTAR N.° 81–150 revisadas al 12.08.2026")

    # Actualiza la fecha visible restante sin alterar fechas históricas de hitos.
    html = html.replace("· Julio 2026", "· Agosto 2026")
    # Normalización final para versiones históricas que aún contengan la sigla incompleta.
    html = re.sub(r"\bSSMOC(?!C)\b", "SSMOCC", html)
    return html
