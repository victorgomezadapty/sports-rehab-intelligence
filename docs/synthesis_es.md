# Qué aprendimos al reunir los tres estudios

## 1. El movimiento aporta descripción; su significado exige validación

En el piloto RIC seleccionado de 30 personas, la mediana de `STRIDE_RATE` fue 81,6364 zancadas/min en ambos lados. Esa coincidencia de medianas grupales no demuestra simetría individual. Los escalares permiten describir variables con las convenciones de la fuente; no se han estimado diferencias por estado de lesión ni validado biomarcadores. La validación oficial de eventos y ciclos sigue pendiente.

La nueva figura de movimiento en la web es una animación didáctica creada para explicar articulaciones. No reconstruye trayectorias, ángulos o eventos de personas. Las mediciones que acompañan la figura sí proceden de los resúmenes originales: por ejemplo, `KNEE_FLEX_PEAK_ANGLE` tiene medianas de −41,6461° a la izquierda y −42,3678° a la derecha, con el signo conservado. Esos números no se utilizan para dibujar la pose.

Fuente de resultados: `data/source-snapshots/Running_Injury_Clinic/reports/tables/pilot_descriptive_summary.csv`. Descriptor científico: https://doi.org/10.1038/s41597-024-04011-7 .

## 2. La historia de entrenamiento aportó una señal de ordenación modesta

En la evaluación primaria de atletas nuevos y periodo futuro de Competitive Runners, el test contiene 7.596 filas y 122 etiquetas positivas. Average precision (AP) fue 0,0199906 frente a una fracción positiva de 0,0160611; ROC-AUC fue 0,545594. Son resultados guardados de ese test seleccionado, no una nueva estimación del atlas. No establecen utilidad clínica, incidencia ni prevención. Separar tiempo y atleta no elimina la selección de controles basada en aptitud futura.

Fuente de resultados: `data/source-snapshots/Competitive_Runners/competitive-runners-injury-risk/reports/phase_02/tables/primary_summary.csv`. Estudio original: https://doi.org/10.1123/ijspp.2020-0518 ; errata: https://doi.org/10.1123/ijspp.2024-0251 .

## 3. La etiqueta más frecuente no fue la que acumuló más días

En la vista original de fútbol, **Hamstring injury** lideró el número de registros: 1.256, con 52.483 días-episodio reportados. **Cruciate ligament tear** acumuló más días-episodio: 56.768, pese a tener 226 registros. La clasificación cambia según se examine frecuencia o carga acumulada. Esto es una comparación descriptiva dentro de la misma fuente, sin inferencia causal ni denominador de exposición. Las sumas pueden repetir días y no equivalen a días únicos, incidencia o disponibilidad porcentual.

Fuente de resultados: `data/source-snapshots/European_Football_Injuries/web/downloads/injury_burden.csv`. Marco metodológico de vigilancia: https://doi.org/10.1136/bjsports-2019-101969 ; frecuencia y carga: https://doi.org/10.1136/bjsports-2017-098160 .

## Resultado de la integración

La síntesis distingue tres preguntas: **qué se mide ahora, qué aporta la historia anterior y qué consecuencias quedaron registradas**. Los estudios muestran por qué esas preguntas requieren medidas, unidades y validaciones diferentes. El catálogo de 104 definiciones, los tres desenlaces y la matriz de compatibilidad hacen trazable esa lectura.

La conclusión conjunta es un marco de investigación complementario, no una correlación entre biomecánica, carga y días de ausencia. Para estudiar esa relación hace falta medir las dimensiones en las mismas personas, con identidad, temporalidad, episodios y exposición verificados. El atlas conserva esa pregunta como siguiente estudio y no presenta una cadena causal observada.

`web/synthesis.js` deriva las cifras presentadas a partir de los agregados comprometidos. Las pruebas comprueban que se utiliza el test combinado correcto, que los signos biomecánicos permanecen intactos y que frecuencia y carga identifican etiquetas distintas. La narrativa nueva no cambia las mediciones ni vuelve a entrenar modelos.
