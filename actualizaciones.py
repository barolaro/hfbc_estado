"""Capa editorial para la presentación HFBC dirigida a MINSAL.

Actualiza textos y estados sin modificar la estructura, estilos ni número de
láminas del HTML maestro.
"""

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
    html = _reemplazar_variantes(
        html,
        (
            "Contrato de concesión, prioridades asistenciales y seguimiento de materias operacionales.",
            "Contrato de concesión, salud financiera y operación de los servicios concesionados.",
        ),
        "Prioridades asistenciales, sostenibilidad del equipamiento y decisiones que requieren articulación MINSAL–SSMOC.",
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
    html = _reemplazar(
        html,
        "Una visión compartida del contrato, las prioridades asistenciales y las materias que requieren coordinación para avanzar con oportunidad y trazabilidad.",
        "El SSMOC cuenta con una cartera priorizada y trazable; el riesgo financiero principal es futuro y cuantificado; y existen decisiones específicas que requieren articulación con MINSAL, la Inspección Fiscal y la DGC.",
    )
    html = _reemplazar(
        html,
        "La oportunidad: estos antecedentes permiten acordar prioridades con el Hospital, ordenar los responsables y anticipar las decisiones que deberán gestionarse ante el CTAR, la Inspección Fiscal, la DGC y MINSAL.",
        "Objetivo de esta reunión: concordar prioridades, responsables y próximos hitos, resguardando las competencias del CTAR y de la Inspección Fiscal y fortaleciendo el acompañamiento de MINSAL en las materias que requieren escalamiento.",
    )
    html = _reemplazar(html, "Cómo Funciona la Concesión del Hospital", "Gobernanza del Contrato: Quién Decide y Quién Destraba")
    html = _reemplazar(
        html,
        "Cinco actores, un contrato. Toque cada actor para ver su rol, su dato clave y qué le pide hoy el Servicio.",
        "Cinco actores con competencias diferenciadas. La propuesta del SSMOC es ordenar el conducto regular, evitar duplicidades y escalar oportunamente las decisiones que exceden el ámbito local.",
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

    # Casos que necesitan apoyo de nivel central.
    html = _reemplazar(html, "Cuatro Casos donde la Llave la Tienen Terceros", "Cuatro Materias que Requieren Articulación de Nivel Central")
    html = _reemplazar(
        html,
        "En estos casos, el avance requiere pronunciamientos o decisiones de la DGC, MINSAL o de la gobernanza del contrato. La coordinación Hospital–Servicio permite sostener la prioridad y reforzar su seguimiento.",
        "El SSMOC ha levantado y formalizado los antecedentes disponibles. El avance requiere pronunciamientos o decisiones fuera de su competencia directa; por ello se propone acordar con MINSAL un mecanismo de escalamiento y seguimiento de hitos.",
    )
    html = _reemplazar(
        html,
        "En términos simples:</b> los antecedentes principales ya fueron levantados y existen gestiones institucionales en curso. El objetivo de esta mesa es validar la prioridad asistencial, completar eventuales brechas y mantener un seguimiento conjunto hasta obtener respuesta.",
        "En términos simples:</b> no se solicita sustituir a la Inspección Fiscal ni a la DGC. Se solicita reforzar la priorización sectorial, completar brechas de antecedentes y mantener seguimiento conjunto hasta obtener decisiones formales.",
    )

    # Respuesta institucional del SSMOC.
    html = _reemplazar(html, "Control del Dato, Formalización y Trazabilidad", "Respuesta del SSMOC: Control, Priorización y Trazabilidad")
    html = _reemplazar(
        html,
        "La respuesta institucional no ha sido esperar: ha sido reconstruir la información, formalizar cada materia y dejar cada gestión con respaldo documental verificable.",
        "El SSMOC consolidó información dispersa, formalizó los principales riesgos y estructuró una cartera con responsable, estado y próximo hito. La prioridad ahora es transformar esa trazabilidad en decisiones oportunas y verificables.",
    )

    # Peticiones concretas a MINSAL, sin agregar láminas.
    html = _reemplazar(html, "Seis Acciones para Anticipar los Años 8 y 10", "Hoja de Ruta Propuesta para los Años 8 y 10")
    html = _reemplazar(
        html,
        "La evidencia no permite afirmar que el contrato sea inviable. Sí obliga a actuar preventivamente — y estas son las acciones concretas.",
        "La evidencia disponible no permite concluir que el contrato sea inviable. Sí justifica una acción preventiva coordinada, con definiciones contractuales, financieras y asistenciales antes de los años de mayor exigencia.",
    )
    html = _reemplazar(html, "Cinco Acuerdos para Convertir el Seguimiento en Avance", "Cinco Acuerdos Propuestos con MINSAL")
    html = _reemplazar(
        html,
        "La reunión debe finalizar con prioridades compartidas, responsables identificados y un próximo hito verificable para cada materia.",
        "Se propone cerrar la reunión con prioridades compartidas, responsables institucionales y un próximo hito verificable para las materias que requieren apoyo o escalamiento sectorial.",
    )
    html = _reemplazar(html, "Validar prioridades", "Validar tres prioridades sectoriales")
    html = _reemplazar(
        html,
        "Confirmar cuáles materias requieren atención inmediata por continuidad asistencial, seguridad o impacto operacional.",
        "Confirmar como focos: sostenibilidad del plan de reposiciones, materias con impacto asistencial y decisiones pendientes de nivel central.",
    )
    html = _reemplazar(html, "Completar antecedentes", "Cerrar brechas de antecedentes")
    html = _reemplazar(html, "Asignar responsables", "Definir contrapartes MINSAL–SSMOC")
    html = _reemplazar(html, "Fijar próximos hitos", "Acordar hitos de escalamiento")
    html = _reemplazar(html, "Revisión periódica", "Seguimiento mensual ejecutivo")
    html = _reemplazar(
        html,
        "Realizar una revisión mensual de la cartera y utilizar el piloto CTAR como visualización común del estado de avance.",
        "Revisar mensualmente la cartera priorizada y utilizar el piloto CTAR como fuente común de estado, sin reemplazar las actas ni los canales formales.",
    )
    html = _reemplazar(html, "Compromiso de información", "Trazabilidad de decisiones")

    # Cierre para una reunión con MINSAL.
    html = _reemplazar_variantes(
        html,
        (
            "Una Cartera Exigente, con Prioridades Compartidas y Camino de Avance.",
            "Una Cartera Exigente, <em>con Prioridades Compartidas y Camino de Avance.</em>",
        ),
        "Una Cartera Exigente, con Diagnóstico, Prioridades y una Ruta de Decisión Compartida.",
    )
    html = _reemplazar(html, "Fuentes: actas CTAR N°81–148 y borrador Acta N.° 149", "Fuentes: actas CTAR N.° 81–150")
    html = _reemplazar(html, "Fuentes: actas CTAR N°81–148 y borrador Acta N.° 149 revisado al 23.07.2026", "Fuentes: actas CTAR N.° 81–150")

    # Actualiza la fecha visible restante sin alterar fechas históricas de hitos.
    html = html.replace("· Julio 2026", "· Agosto 2026")
    return html
