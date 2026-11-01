# Sports Rehab Intelligence — propuesta inicial archivada

Documento de planificación conservado como contexto. El estado actual está en el README de la raíz; los enlaces relativos de esta propuesta corresponden a su ubicación inicial.

**Proyecto integrador de Sports Rehabilitation & Human Performance**  
Propuesta y base técnica inicial · 1 de noviembre de 2026 · Víctor Andrés Gómez López

## La idea

Convertir los tres estudios en un proyecto de síntesis que explique qué aporta la biomecánica, qué aporta el seguimiento del entrenamiento y qué aportan los registros de ausencia a la investigación de lesiones deportivas. La contribución inicial es un **atlas de evidencia y compatibilidad de datos**, acompañado de un catálogo común de variables y una especificación de los datos necesarios para estudiar el recorrido completo de un deportista.

La pregunta central es: **¿Qué podemos observar sobre movimiento, entrenamiento y consecuencias de la lesión con estas tres fuentes, y qué conexiones requieren nuevos datos?**

El recorrido conceptual es movimiento → entrenamiento y respuesta → lesión → ausencia → retorno y disponibilidad. Las fuentes actuales cubren partes distintas de ese recorrido, en personas distintas. Las flechas son preguntas de investigación; los tres estudios no demuestran esa cadena causal.

## Qué aporta cada proyecto

| Componente | Evidencia local disponible | Aporte al proyecto global | Límite que debe acompañarlo |
| --- | --- | --- | --- |
| [Running Injury Clinic](../Running_Injury_Clinic/README.md) | Metadatos de 1.402 personas con carrera; piloto seleccionado de 30 personas y 13 variables por lado | Movimiento, metadatos clínicos y calidad de medición | El piloto conserva escalares de origen; la validación oficial de eventos y ciclos sigue pendiente |
| [Competitive Runners](../Competitive_Runners/competitive-runners-injury-risk/README.md) | 74 atletas, 42.766 eventos seleccionados en Day y 583 etiquetas positivas; evaluación temporal y por atleta | Historia de carga, descanso, respuesta subjetiva y límites de predicción | Los controles dependen de selección que usa información futura; la proporción de etiquetas no es incidencia prospectiva |
| [European Football Injuries](../European_Football_Injuries/README.md) | 15.603 registros de ausencia; 4.081 nombres registrados; duración y partidos perdidos | Frecuencia registrada, severidad por registro y carga acumulada de ausencias | Los nombres no son identidades verificadas; no hay denominador para incidencia o porcentaje de disponibilidad |

Estas cifras tienen unidades y poblaciones diferentes. No se suman para presentar un total de deportistas o de lesiones. Day y Week tampoco son cohortes independientes.

## Qué significa cruzar la información

La primera integración cruza **definiciones, cobertura, calidad y resultados**, con trazabilidad hasta cada estudio. El catálogo técnico conserva las variables originales bajo un identificador de fuente: una etiqueta de lesión, una unidad o una escala no se vuelve equivalente por compartir nombre.

| Cruce propuesto | Qué podemos entregar ahora | Qué falta para una asociación individual |
| --- | --- | --- |
| Biomecánica × entrenamiento | Comparar dominios medidos, protocolos, unidades y momentos de observación; formular hipótesis | Una cohorte con ambas modalidades medidas en las mismas personas y en fechas pertinentes |
| Entrenamiento × consecuencias | Contrastar qué desenlaces observa cada fuente y qué información falta para pasar de una etiqueta a días de ausencia | Entrenamiento y episodios clínicos vinculados, seguimiento completo y exposición elegible |
| Biomecánica × ausencia | Documentar qué mediciones y desenlaces tendría que reunir un estudio que evalúe esa relación | Mediciones previas, identidad estable y desenlaces clínicos observados en esas mismas personas |
| Tres fuentes × calidad | Comparar selección de registros, definición de lesión, unidad de análisis, validación y procedencia | No requiere fusionar participantes; es el análisis integrador disponible ahora |

No se ha identificado una correspondencia verificada de participantes entre las tres fuentes. El piloto RIC no puede validar los modelos de carga, y el fútbol no puede aportar el tiempo de baja de los corredores. Tampoco existe aquí una estimación conjunta que permita calcular una correlación, un efecto combinado o un riesgo individual con las tres modalidades.

## Resultado final propuesto

Un proyecto principal de portfolio, **Sports Rehab Intelligence — Movimiento, entrenamiento y consecuencias de la lesión**, con cinco componentes:

1. **Atlas de evidencia:** exploración por pregunta y dominio, con enlaces a los tres estudios y límites visibles junto a cada resultado.
2. **Catálogo común:** fuente, variable original, definición, unidad, granularidad, base temporal, desenlace y estado de verificación. El catálogo inicial ya se puede generar con este directorio.
3. **Análisis de compatibilidad:** matriz que muestre qué relaciones están observadas dentro de una fuente, cuáles solo pueden discutirse conceptualmente y qué información falta. Esta es la primera contribución transversal.
4. **Informe de síntesis:** resultados de cada estudio con sus propios denominadores, explicación de discrepancias y preguntas nuevas. Una revisión bibliográfica específica tendría su búsqueda y referencias propias; no se considera realizada en esta entrega.
5. **Diseño de una futura cohorte vinculada:** especificación de mediciones, fechas y desenlaces que permita comprobar las conexiones. No contiene personas ni datos simulados presentados como reales.

El valor diferencial es mostrar cómo se construye una visión completa de rehabilitación deportiva a partir de evidencia parcial, y qué decisiones de datos permiten avanzar. Una interfaz visual puede presentar el recorrido completo sin atribuir a una fuente mediciones realizadas en otra.

## Orden de desarrollo

**Fase 0 — auditoría y base inicial, entregada aquí.** Inventario de resultados agregados, catálogo de definiciones con fuente y hashes de los archivos utilizados. Se documentan las compatibilidades y las conexiones pendientes. No incluye aplicación publicada ni análisis clínico integrado.

**Fase 1 — estudio integrador.** Revisar el catálogo variable por variable; completar el registro de desenlaces; documentar escalas, convenciones y disponibilidad temporal; preparar el informe de síntesis y su búsqueda bibliográfica. Comprobar que toda afirmación pueda rastrearse a una salida o referencia específica. Las tablas de resultados conservarán la fuente y su denominador.

**Fase 2 — presentación interactiva.** Construir el atlas como proyecto principal de Sports Rehab. Navegación por movimiento, entrenamiento, lesión y consecuencias; comparación de fuentes y acceso a los estudios originales. Publicar después de revisar datos y atribución. No se añade un formulario de riesgo clínico a partir de estos resultados.

**Fase 3 — conexiones empíricas nuevas.** Completar primero la validación pendiente de RIC si se amplía su uso biomecánico. Para estudiar relaciones entre modalidades, obtener una fuente realmente multimodal o recoger una cohorte vinculada. Definir la pregunta, el desenlace y la validación antes de entrenar un modelo conjunto.

## Contrato mínimo para una futura cohorte

Cada tabla conservará `source_id`, versión, identificador de participante dentro de su fuente, unidad de observación y procedencia. Una correspondencia entre fuentes requerirá evidencia explícita y un registro de casos ambiguos.

| Entidad | Campos esenciales que habría que verificar |
| --- | --- |
| Evaluación biomecánica | Participante, sesión, fecha de medición, protocolo, velocidad, lado, variable, unidad y validación de eventos/ciclos |
| Entrenamiento y respuesta | Participante, sesión/día, fecha medida, fecha disponible para análisis, duración, distancia, intensidad, escala subjetiva y motivo de ausencia de datos |
| Episodio clínico | Participante, inicio, diagnóstico, lado, criterio de lesión, procedencia clínica y estado de adjudicación |
| Seguimiento y retorno | Fecha de evaluación, fin observado o esperado, criterio de retorno, censura, ventana de seguimiento y elegibilidad |
| Exposición y disponibilidad | Horas de entrenamiento/competición, sesiones o partidos elegibles, participación y cobertura del registro |

Un campo ausente permanece ausente. Las fechas relativas no se convierten en fechas de calendario sin un origen verificado. Las escalas subjetivas y las taxonomías conservarán su definición original hasta comprobar equivalencia.

## Reproducir la base inicial

Desde este directorio, con Python 3.11 o posterior y sin dependencias adicionales:

```powershell
python scripts/build_evidence_snapshot.py
```

El script lee exclusivamente resúmenes agregados y catálogos de definiciones ya existentes en las carpetas hermanas. No abre datos individuales, no modifica los tres proyectos, no entrena modelos y no necesita red.

Genera:

- `reports/integration_snapshot.json`: cifras por fuente, definiciones de desenlace y procedencia con SHA-256.
- `reports/feature_catalog.json`: definiciones originales con identificadores de fuente; no incluye mediciones de participantes.
- `reports/integration_snapshot.md`: inventario legible de las cifras y del tamaño de cada catálogo.

Los hashes identifican los archivos usados en la síntesis; no validan la exactitud clínica de los datos originales. La generación comprueba campos, tipos, coherencia de conteos y unicidad de las claves del catálogo. No vuelve a ejecutar los análisis originales.

## Atribución y límites de reutilización

RIC procede del dataset Figshare de Ferber y colaboradores, versión 1, CC BY 4.0; Competitive Runners utiliza los datos de Lövdal, den Hartigh y Azzopardi, Dataverse v2.0, CC0; fútbol utiliza Kaggle v2 de Sanan Muzaffarov, con derivados CC BY-SA 4.0 según el proyecto fuente. Las referencias y condiciones completas permanecen en los README y documentos de licencia de cada estudio.

Los catálogos y resultados integrados conservan su procedencia y sus condiciones de origen. Esta carpeta no asigna una licencia única a todos los datos. La revisión de publicación debe conservar los avisos de atribución y las obligaciones aplicables a cada componente.
