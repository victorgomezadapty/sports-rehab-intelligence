import { summarizeAtlas } from './synthesis.js';
import { createMovementExplorer } from './movement.js';

let language = 'es';
try { language = localStorage.getItem('sri-language') === 'en' ? 'en' : 'es'; } catch {}
let atlas;
let selected = 'ric';
let selectedDomain = 'running_kinematics';
let page = 0;
const pageSize = 8;
const chartChoices = { ric: 'STRIDE_RATE', competitive_runners: '2', european_football: 'injury_count' };
const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const t = (es, en) => language === 'es' ? es : en;
const number = (value, precision = 0) => Number(value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision, useGrouping: true });
const sourceNames = { ric: 'RIC', competitive_runners: 'RUNNERS', european_football: 'FOOTBALL' };
const statuses = () => ({ available: t('Registrado', 'Recorded'), provisional: t('Provisional', 'Provisional'), different_construct: t('Otro constructo', 'Different construct'), not_available: t('No disponible', 'Not available') });
const movementExplorer = createMovementExplorer();

function renderSynthesis() {
  const container = $('#conclusion-results');
  if (!container) return;
  const facts = summarizeAtlas(atlas);
  const cards = [
    {
      tag: '01 / MOVEMENT', title: t('Medir movimiento todavía no identifica una lesión.', 'Measuring movement does not yet identify injury.'),
      result: t(`La mediana de STRIDE_RATE fue ${number(facts.strideLeft, 2)} zancadas/min en ambos lados, dentro del piloto seleccionado de ${facts.pilotN} personas.`, `Median STRIDE_RATE was ${number(facts.strideLeft, 2)} strides/min on both sides in the selected ${facts.pilotN}-person pilot.`),
      meaning: t('El piloto permite describir mediciones y revisar su calidad. No se estimaron diferencias por lesión ni se validó un biomarcador; los eventos y ciclos siguen pendientes de validación.', 'The pilot describes measurements and their quality. It did not estimate injury-group differences or validate a biomarker; event and cycle validation remains pending.'), link: '#movement', linkLabel: t('Explorar movimiento y mediciones', 'Explore movement and measurements'),
    },
    {
      tag: '02 / TRAINING', title: t('La historia de carga aporta una señal limitada.', 'Training history provides a limited signal.'),
      result: t(`En atletas nuevos y un periodo futuro: AP ${number(facts.averagePrecision, 4)}, frente a ${number(facts.positiveFraction, 4)} de fracción positiva en ${number(facts.testRows)} filas de test.`, `For unseen athletes in a future period: AP ${number(facts.averagePrecision, 4)}, against a ${number(facts.positiveFraction, 4)} positive fraction in ${number(facts.testRows)} test rows.`),
      meaning: t('Ese resultado muestra una capacidad de ordenación modesta en la muestra seleccionada. No basta para trasladar el modelo a alertas clínicas; además, los controles se eligieron usando aptitud futura.', 'That result shows modest ranking in the selected sample. It is insufficient to transfer the model into clinical alerts; controls were also selected using future fitness.'), link: '#studies', linkLabel: t('Ver evaluación y estudio original', 'View evaluation and original study'),
    },
    {
      tag: '03 / CONSEQUENCES', title: t('Lo más frecuente no acumula la mayor carga.', 'The most frequent label does not have the greatest burden.'),
      result: t(`Hamstring injury lidera la frecuencia: ${number(facts.mostFrequent.injury_count)} registros. Cruciate ligament tear lidera la suma: ${number(facts.greatestBurden.total_days_out)} días-episodio en ${number(facts.greatestBurden.injury_count)} registros.`, `Hamstring injury leads frequency: ${number(facts.mostFrequent.injury_count)} records. Cruciate ligament tear leads summed burden: ${number(facts.greatestBurden.total_days_out)} episode-days in ${number(facts.greatestBurden.injury_count)} records.`),
      meaning: t('Contar registros y cuantificar sus consecuencias cambia qué etiquetas destacan. La prioridad descriptiva depende de la medida; las sumas pueden repetir días y no son una tasa de incidencia.', 'Counting records and quantifying consequences changes which labels stand out. Descriptive priorities depend on the measure; sums can repeat days and are not incidence rates.'), link: '#studies', linkLabel: t('Comparar frecuencia y consecuencias', 'Compare frequency and consequences'),
    },
  ];
  container.innerHTML = cards.map((card, index) => `<article class="finding-card finding-${index}"><span class="finding-tag">${card.tag}</span><h3>${card.title}</h3><p class="finding-result">${card.result}</p><p>${card.meaning}</p><a href="${card.link}"${index > 0 ? ` data-open-study="${index === 1 ? 'competitive_runners' : 'european_football'}"` : ''}>${card.linkLabel} ↗</a></article>`).join('');
  container.querySelectorAll('[data-open-study]').forEach((link) => link.addEventListener('click', () => { selected = link.dataset.openStudy; renderStudy(); }));
}

function setLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-es][data-en]').forEach((element) => { element.textContent = element.dataset[language]; });
  const button = $('#language');
  if (button) {
    button.textContent = language === 'es' ? 'EN' : 'ES';
    button.setAttribute('aria-label', t('Switch to English', 'Cambiar a español'));
  }
  const group = $('.study-tabs');
  group?.setAttribute('aria-label', t('Elegir estudio', 'Choose a study'));
  $('.joint-controls')?.setAttribute('aria-label', t('Articulación', 'Joint'));
  if ($('#runner-title')) $('#runner-title').textContent = t('Esquema animado de un corredor', 'Animated runner diagram');
  if ($('#runner-desc')) $('#runner-desc').textContent = t('Animación didáctica de articulaciones. No reproduce trayectorias, ángulos o eventos de participantes.', 'Educational joint animation. It does not reproduce participant trajectories, angles or events.');
  $('#motion')?.setAttribute('aria-label', t('Pausar o reanudar el diagrama conceptual', 'Pause or resume the conceptual diagram'));
  $('#map-title') && ($('#map-title').textContent = t('Tres fuentes conectadas en un atlas de evidencia', 'Three sources connected in an evidence atlas'));
  $('#map-desc') && ($('#map-desc').textContent = t('Diagrama conceptual de dominios complementarios. No representa participantes vinculados ni causalidad.', 'Conceptual diagram of complementary domains. It does not represent linked participants or causality.'));
  document.title = t('Sports Rehab Intelligence — Tres estudios, una visión conectada', 'Sports Rehab Intelligence — Three studies, one connected perspective');
  if (document.body.classList.contains('evidence-body')) document.title = t('Evidencia y métodos — Sports Rehab Intelligence', 'Evidence and methods — Sports Rehab Intelligence');
  updateMotionText();
  if (atlas) render();
}

function updateMotionText() {
  const button = $('#motion');
  if (!button) return;
  button.textContent = document.body.classList.contains('motion-paused') ? t('Reanudar movimiento', 'Resume motion') : t('Pausar movimiento', 'Pause motion');
}

function bars(items, max, color = '#bdea85') {
  return `<div class="plot" role="img" aria-label="${escape(t('Comparación descriptiva; valores y contexto en la tabla siguiente', 'Descriptive comparison; values and context in the following table'))}">${items.map((item) => `<div class="plot-line"><span class="plot-label">${escape(item.label)}</span><svg class="bar-track" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="12" fill="#2a3941"/><rect width="${Math.max(0, Math.min(100, 100 * item.value / max))}" height="12" fill="${item.color || color}"/></svg><span class="plot-value">${escape(item.display)}</span></div>`).join('')}</div>`;
}

function table(headers, rows) {
  return `<table class="chart-table"><thead><tr>${headers.map((header) => `<th scope="col">${escape(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value, index) => index === 0 ? `<th scope="row">${escape(value)}</th>` : `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function quartilePlot(rows, side) {
  const low = Math.min(...rows.map((row) => Number(row.minimum)));
  const high = Math.max(...rows.map((row) => Number(row.maximum)));
  const span = high - low || 1;
  const position = (value) => 4 + 92 * (Number(value) - low) / span;
  return `<div class="plot" role="img" aria-label="${escape(t('Mediana y cuartiles por lado; valores en la tabla siguiente', 'Median and quartiles by side; values in the following table'))}">${rows.map((row) => `<div class="plot-line"><span class="plot-label">${side(row.side)}</span><svg class="quartile-plot" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true"><path d="M${position(row.minimum)} 8H${position(row.maximum)}" stroke="#65797b" stroke-width="1"/><rect x="${position(row.q1)}" y="4" width="${Math.max(.4, position(row.q3) - position(row.q1))}" height="8" fill="#4a6545"/><path d="M${position(row.median)} 2V14" stroke="#bdea85" stroke-width="2"/></svg><span class="plot-value">${number(row.median, 3)}</span></div>`).join('')}<div class="plot-axis"><span>${number(low, 3)}</span><span>${number(high, 3)}</span></div></div>`;
}

function chart() {
  if (selected === 'ric') {
    const feature = chartChoices.ric;
    const features = [...new Set(atlas.charts.ric_pilot_descriptives.map((row) => row.feature))];
    const rows = atlas.charts.ric_pilot_descriptives.filter((row) => row.feature === feature);
    const side = (value) => value === 'left' ? t('Izquierdo', 'Left') : t('Derecho', 'Right');
    return `<h3 class="chart-title">${t('Piloto biomecánico · mediana por lado', 'Biomechanical pilot · median by side')}</h3><p class="chart-meta">n = 30 / ${escape(rows[0].unit)} / ${t('escalares de origen', 'source scalars')}</p><label for="chart-choice">${t('Variable', 'Variable')}<select id="chart-choice">${features.map((name) => `<option value="${escape(name)}"${name === feature ? ' selected' : ''}>${escape(name)}</option>`).join('')}</select></label>${quartilePlot(rows, side)}${table([t('Lado', 'Side'), 'n', t('Mediana', 'Median'), 'Q1', 'Q3', t('Mín.', 'Min'), t('Máx.', 'Max')], rows.map((row) => [side(row.side), row.n, number(row.median, 3), number(row.q1, 3), number(row.q3, 3), number(row.minimum, 3), number(row.maximum, 3)]))}<p class="chart-caption">${t('Línea verde: mediana. Franja: Q1–Q3. Extremos: mínimo y máximo. Sin pruebas por estado de lesión ni umbrales clínicos. Cada variable conserva su escala y signo.', 'Green line: median. Band: Q1–Q3. Ends: minimum and maximum. No injury-status tests or clinical thresholds. Each variable retains its scale and sign.')} ${escape(rows[0].unit)}</p>`;
  }
  if (selected === 'competitive_runners') {
    const protocols = [t('Atletas conocidos / futuro', 'Known athletes / future'), t('Atletas nuevos / todos los periodos', 'Unseen athletes / all periods'), t('Atletas nuevos / futuro', 'Unseen athletes / future')];
    const row = atlas.charts.runners_primary_validation[Number(chartChoices.competitive_runners)];
    const ap = Number(row['Pooled AP']);
    const fraction = Number(row['Label fraction']);
    return `<h3 class="chart-title">${t('Señal predictiva en la muestra de test', 'Ranking signal in the test sample')}</h3><p class="chart-meta">${t('Evaluación primaria guardada · sin reentrenamiento', 'Saved primary evaluation · no retraining')}</p><label for="chart-choice">${t('Validación', 'Validation')}<select id="chart-choice">${protocols.map((name, index) => `<option value="${index}"${String(index) === chartChoices.competitive_runners ? ' selected' : ''}>${name}</option>`).join('')}</select></label>${bars([{ label: 'Average precision', value: ap, display: number(ap, 4) }, { label: t('Fracción positiva', 'Positive fraction'), value: fraction, display: number(fraction, 4), color: '#748994' }], Math.max(ap, fraction) * 1.25, '#9fc7f1')}${table([t('Métrica', 'Metric'), t('Valor', 'Value')], [['Average precision', number(ap, 4)], [t('Fracción positiva', 'Positive fraction'), number(fraction, 4)], [t('Filas de test', 'Test rows'), number(row.Rows)], [t('Etiquetas positivas', 'Positive labels'), number(row.Labels)], ['ROC-AUC', number(row['ROC-AUC'], 4)], ['Brier', number(row.Brier, 5)]] )}<p class="chart-caption">${t('AP es average precision no interpolada. La fracción positiva es una referencia de frecuencia en este test seleccionado, no incidencia prospectiva. Los controles exigían aptitud futura.', 'AP is non-interpolated average precision. The positive fraction is a frequency reference in this selected test, not prospective incidence. Controls required future fitness.')}</p>`;
  }
  const options = { injury_count: t('Frecuencia registrada', 'Recorded frequency'), median_days_out: t('Mediana de duración', 'Median duration'), total_days_out: t('Suma de días por registro', 'Sum of episode-days') };
  const metric = chartChoices.european_football;
  const rows = [...atlas.charts.football_burden].sort((a, b) => Number(b[metric]) - Number(a[metric])).slice(0, 5);
  const units = metric === 'injury_count' ? t('registros', 'records') : metric === 'median_days_out' ? t('días / registro', 'days / record') : t('días-episodio', 'episode-days');
  return `<h3 class="chart-title">${t('Etiquetas originales · cinco primeras', 'Original labels · top five')}</h3><p class="chart-meta">${escape(units)} / ${t('vista de registros originales', 'original-record view')}</p><label for="chart-choice">${t('Medida', 'Measure')}<select id="chart-choice">${Object.entries(options).map(([key, label]) => `<option value="${key}"${key === metric ? ' selected' : ''}>${label}</option>`).join('')}</select></label>${bars(rows.map((row) => ({ label: row.injury_type_raw, value: Number(row[metric]), display: number(row[metric], metric === 'median_days_out' ? 1 : 0) })), Math.max(...rows.map((row) => Number(row[metric]))) * 1.05, '#f0b98f')}${table([t('Etiqueta', 'Label'), 'n', options[metric]], rows.map((row) => [row.injury_type_raw, number(row.injury_count), number(row[metric], metric === 'median_days_out' ? 1 : 0)]))}${table([t('Vista de sensibilidad', 'Sensitivity view'), t('Registros', 'Records')], atlas.charts.football_duplicate_sensitivity.map((row, index) => [index === 0 ? t('Fuente original', 'Source records') : t('Colapso candidato', 'Candidate collapsing'), number(row.record_count)]))}<p class="chart-caption">${t('Las ausencias incluyen etiquetas musculoesqueléticas, enfermedad y otros motivos. El colapso candidato no adjudica episodios. Las sumas pueden repetir días y partidos. Consulta n antes de interpretar medianas poco frecuentes.', 'Absences include musculoskeletal labels, illness and other reasons. Candidate collapsing does not adjudicate episodes. Sums can repeat days and matches. Check n before interpreting rare-label medians.')}</p>`;
}

function renderStudy() {
  const panel = $('#study-panel');
  if (!panel) return;
  const source = atlas.sources.find((source) => source.source_id === selected);
  const findings = summarizeAtlas(atlas);
  const content = {
    ric: {
      title: t('El movimiento, con su contexto.', 'Movement, with its context.'),
      description: t('Metadatos de carrera de 1.402 personas y un piloto técnico seleccionado de 30 participantes. Exploramos variables bilaterales guardadas por la fuente y su calidad técnica.', 'Running metadata for 1,402 people and a selected 30-person technical pilot. Explore upstream bilateral variables and their technical quality.'),
      metrics: [['30', t('personas en el piloto', 'people in the pilot')], ['13', t('variables por lado', 'variables per side')], ['780', t('escalares de origen', 'source scalars')]],
      note: t('Validación oficial de eventos y ciclos pendiente: 0 ensayos validados independientemente en esta entrega. Los valores no son umbrales diagnósticos.', 'Official event and cycle validation pending: 0 independently validated trials in this release. Values are not diagnostic thresholds.'),
      slug: 'running-injury-clinic',
      method: t('Piloto técnico seleccionado: 30 personas, 13 variables por lado y control estructural de los archivos. Se extraen escalares de origen, sin reconstrucción independiente.', 'Selected technical pilot: 30 people, 13 variables per side and structural file checks. Upstream scalars are extracted without independent reconstruction.'),
      finding: t(`STRIDE_RATE tiene una mediana de ${number(findings.strideLeft, 2)} zancadas/min en ambos lados. Esa coincidencia de medianas grupales no demuestra simetría individual ni normalidad clínica.`, `Median STRIDE_RATE is ${number(findings.strideLeft, 2)} strides/min on both sides. Equal group medians do not establish individual symmetry or clinical normality.`),
      conclusion: t('Aporta una base descriptiva del movimiento y sus convenciones. El siguiente paso es validar eventos/ciclos antes de inferir diferencias biomecánicas por lesión.', 'It provides a descriptive movement baseline and its conventions. The next step is event/cycle validation before inferring injury-related biomechanical differences.'),
      paper: 'https://doi.org/10.1038/s41597-024-04011-7', paperLabel: t('Descriptor científico de la fuente', 'Scientific source descriptor'),
    },
    competitive_runners: {
      title: t('El entrenamiento antes de la etiqueta.', 'Training before the label.'),
      description: t('Historias de carga, descanso y respuesta subjetiva anteriores a eventos seleccionados. La evaluación distingue tiempo futuro, atletas nuevos y la combinación de ambos.', 'Load, rest and subjective-response histories before selected events. Evaluation distinguishes future time, unseen athletes and both together.'),
      metrics: [['74', t('atletas', 'athletes')], [number(42766), t('eventos Day seleccionados', 'selected Day events')], ['583', t('etiquetas retenidas', 'retained labels')]],
      note: t('Los controles se seleccionaron usando aptitud futura. La proporción de etiquetas y el rendimiento en test dependen de esa muestra; no son riesgo clínico ni incidencia.', 'Controls were selected using future fitness. Label fraction and test performance depend on that sample; they are not clinical risk or incidence.'),
      slug: 'competitive-runners-injury-risk',
      method: t('Reanálisis de 74 atletas con modelos logísticos fijos, calibración independiente y separación temporal y por atleta. Aquí se muestran los resultados primarios ya guardados.', 'Reanalysis of 74 athletes with fixed logistic models, independent calibration and temporal/athlete separation. This view presents saved primary results.'),
      finding: t(`En el test combinado de atletas nuevos y futuro: ${number(findings.testLabels)} etiquetas en ${number(findings.testRows)} filas; AP ${number(findings.averagePrecision, 4)} y ROC-AUC ${number(findings.rocAuc, 4)}.`, `In the combined unseen-athlete/future test: ${number(findings.testLabels)} labels in ${number(findings.testRows)} rows; AP ${number(findings.averagePrecision, 4)} and ROC-AUC ${number(findings.rocAuc, 4)}.`),
      conclusion: t('Las señales de entrenamiento no bastaron para establecer utilidad clínica. Evaluar atletas nuevos y tiempo futuro es una pregunta más exigente que describir asociaciones retrospectivas.', 'Training signals did not establish clinical utility. Evaluating unseen athletes and future time asks a more demanding question than describing retrospective associations.'),
      paper: 'https://doi.org/10.1123/ijspp.2020-0518', paperLabel: t('Estudio original · leer junto a su errata', 'Original study · read alongside its erratum'),
    },
    european_football: {
      title: t('El coste de estar ausente.', 'The cost of being absent.'),
      description: t('Registros de ausencia en cinco ligas europeas. Frecuencia, duración por registro y carga acumulada muestran dimensiones distintas del impacto registrado.', 'Absence records across five European leagues. Frequency, duration per record and cumulative burden describe distinct dimensions of recorded impact.'),
      metrics: [[number(15603), t('registros de ausencia', 'absence records')], ['5', t('ligas europeas', 'European leagues')], ['18', t('mediana de días / registro', 'median days / record')]],
      note: t('Los nombres no verifican identidad. No hay exposición elegible completa ni retorno clínico confirmado. Frecuencia de registros, carga acumulada y disponibilidad son conceptos distintos.', 'Names do not verify identity. Complete eligible exposure and verified clinical return are absent. Record frequency, cumulative burden and availability are different concepts.'),
      slug: 'european-football-injuries',
      method: t('Análisis descriptivo por etiqueta original: frecuencia, duración reportada y partidos perdidos. La vista de 14.611 registros es sensibilidad al colapso de intervalos candidatos repetidos.', 'Descriptive original-label analysis: frequency, reported duration and match loss. The 14,611-record view is a candidate repeated-interval collapsing sensitivity.'),
      finding: t(`Hamstring injury: ${number(findings.mostFrequent.injury_count)} registros y ${number(findings.mostFrequent.total_days_out)} días-episodio. Cruciate ligament tear: ${number(findings.greatestBurden.injury_count)} registros y ${number(findings.greatestBurden.total_days_out)} días-episodio.`, `Hamstring injury: ${number(findings.mostFrequent.injury_count)} records and ${number(findings.mostFrequent.total_days_out)} episode-days. Cruciate ligament tear: ${number(findings.greatestBurden.injury_count)} records and ${number(findings.greatestBurden.total_days_out)} episode-days.`),
      conclusion: t('Frecuencia, severidad por registro y carga acumulada cambian la lectura del impacto. No se debe convertir una clasificación por conteo en una clasificación por riesgo o disponibilidad.', 'Frequency, per-record severity and cumulative burden change the interpretation of impact. A record-count ranking must not become a risk or availability ranking.'),
      paper: 'https://doi.org/10.1136/bjsports-2019-101969', paperLabel: t('Consenso IOC para interpretar las medidas', 'IOC consensus for interpreting the measures'),
    },
  }[selected];
  panel.dataset.selected = selected;
  panel.innerHTML = `<div class="study-layout"><div class="study-copy"><h3>${content.title}</h3><p>${content.description}</p><div class="study-metrics">${content.metrics.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('')}</div><p class="scope-note">${content.note}</p><div class="study-links"><a href="https://${content.slug}.vercel.app" target="_blank" rel="noopener">${t('Explorar estudio', 'Explore study')} ↗</a><a href="https://victor-gomez-portfolio.vercel.app/projects/${content.slug}">${t('Caso en el portfolio', 'Portfolio case')} ↗</a><a href="https://github.com/victorgomezadapty/${content.slug}" target="_blank" rel="noopener">GitHub ↗</a></div><p class="chart-caption">${escape(source.licence)}</p></div><div class="chart-panel">${chart()}</div></div>`;
  panel.insertAdjacentHTML('beforeend', `<div class="study-interpretation"><section><h4>${t('Cómo se estudió', 'How it was studied')}</h4><p>${content.method}</p></section><section><h4>${t('Qué se encontró', 'What was found')}</h4><p>${content.finding}</p></section><section><h4>${t('Conclusión de este estudio', 'Study conclusion')}</h4><p>${content.conclusion}</p></section></div><p class="study-citation"><a href="${content.paper}" target="_blank" rel="noopener">${content.paperLabel} ↗</a> · <a href="evidence.html">${t('Todos los estudios y referencias', 'All studies and references')} ↗</a></p>`);
  document.querySelectorAll('[data-source]').forEach((button) => {
    button.classList.toggle('active', button.dataset.source === selected);
    button.setAttribute('aria-pressed', String(button.dataset.source === selected));
  });
  $('#chart-choice')?.addEventListener('change', (event) => { chartChoices[selected] = event.target.value; renderStudy(); $('#chart-choice')?.focus(); });
}

function renderMatrix() {
  if (!$('#matrix-body')) return;
  $('#matrix-body').innerHTML = atlas.matrix.domains.map((domain) => `<tr><td><button type="button" class="domain-button" data-domain="${domain.domain_id}" aria-pressed="${domain.domain_id === selectedDomain}">${escape(domain[language])}</button></td>${atlas.sources.map((source) => `<td><span><i class="dot ${domain[source.source_id]}" aria-hidden="true"></i>${statuses()[domain[source.source_id]]}</span></td>`).join('')}</tr>`).join('');
  const domain = atlas.matrix.domains.find((item) => item.domain_id === selectedDomain);
  $('#matrix-note').innerHTML = `<strong>${escape(domain[language])}</strong> / ${escape(domain[`note_${language}`])}`;
  document.querySelectorAll('[data-domain]').forEach((button) => button.addEventListener('click', () => { selectedDomain = button.dataset.domain; renderMatrix(); document.querySelector(`[data-domain="${selectedDomain}"]`)?.focus(); }));
}

function renderCatalog() {
  if (!$('#catalog-results')) return;
  const query = $('#search').value.trim().toLowerCase();
  const source = $('#source-filter').value;
  const rows = atlas.catalog.filter((row) => (source === 'all' || row.source_id === source) && [row.original_variable, row.definition, row.source_domain_or_role, row.units].some((value) => String(value).toLowerCase().includes(query)));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  page = Math.min(page, pages - 1);
  $('#catalog-count').textContent = t(`${rows.length} de 104 definiciones · abre una variable para ver el contexto original.`, `${rows.length} of 104 definitions · open a variable to inspect its original context.`);
  $('#catalog-results').innerHTML = rows.slice(page * pageSize, (page + 1) * pageSize).map((row) => `<details class="catalog-item"><summary><span class="catalog-variable">${escape(row.original_variable)} <span aria-hidden="true">+</span></span><span class="catalog-unit">${escape(row.units || '—')}</span><span class="source-badge ${row.source_id}">${sourceNames[row.source_id]}</span></summary><div class="catalog-detail"><p>${escape(row.definition)}</p><p><strong>${t('Contexto', 'Context')}:</strong> ${escape(row.observation_context)} / ${escape(row.source_domain_or_role)}</p><p><strong>${t('Verificación / tiempo', 'Verification / timing')}:</strong> ${escape(row.timing_or_verification)}</p><p><strong>${t('Límite', 'Limitation')}:</strong> ${escape(row.limitations || t('Ver registro de desenlaces y metodología.', 'See outcome registry and methodology.'))}</p><pre>${escape(JSON.stringify(JSON.parse(row.original_definition_json), null, 2))}</pre></div></details>`).join('') || `<p class="no-results">${t('No hay resultados. Prueba otro término o fuente.', 'No results. Try another term or source.')}</p>`;
  $('#page-number').textContent = `${page + 1} / ${pages}`;
  $('#previous').disabled = page === 0;
  $('#next').disabled = page >= pages - 1;
}

function renderReferences() {
  if (!$('#references')) return;
  $('#references').innerHTML = atlas.references.map((reference, index) => `<article class="reference-item"><small>${String(index + 1).padStart(2, '0')} / ${escape(reference.type)}</small><h3><a href="${escape(reference.url)}" target="_blank" rel="noopener">${escape(reference.title)} ↗</a></h3><p>${escape(reference.authors)} · ${reference.year}</p><p>${escape(reference[`use_${language}`])}</p></article>`).join('');
}

function render() { renderSynthesis(); renderStudy(); renderMatrix(); renderCatalog(); renderReferences(); movementExplorer?.update(atlas, language); }
$('#language')?.addEventListener('click', () => { language = language === 'es' ? 'en' : 'es'; try { localStorage.setItem('sri-language', language); } catch {} setLanguage(); });
$('#motion')?.addEventListener('click', () => { const paused = document.body.classList.toggle('motion-paused'); $('#motion').setAttribute('aria-pressed', String(paused)); updateMotionText(); });
document.querySelectorAll('[data-source]').forEach((button) => button.addEventListener('click', () => { selected = button.dataset.source; renderStudy(); }));
$('#search')?.addEventListener('input', () => { page = 0; renderCatalog(); });
$('#source-filter')?.addEventListener('change', () => { page = 0; renderCatalog(); });
$('#previous')?.addEventListener('click', () => { page--; renderCatalog(); });
$('#next')?.addEventListener('click', () => { page++; renderCatalog(); });
setLanguage();
try {
  const response = await fetch('data/atlas.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  atlas = await response.json();
  render();
  $('#load-status') && ($('#load-status').textContent = t('Atlas cargado: tres fuentes, 104 definiciones.', 'Atlas loaded: three sources, 104 definitions.'));
} catch (error) {
  console.error(error);
  const message = `<div class="error-state"><p>${t('No se pudieron cargar los datos. Recarga la página o consulta las descargas y el repositorio.', 'The data could not be loaded. Reload the page or use the downloads and repository.')}</p><a href="downloads/atlas_summary.json">${t('Descargar datos', 'Download data')} ↓</a></div>`;
  for (const selector of ['#study-panel', '#catalog-results', '#references']) if ($(selector)) $(selector).innerHTML = message;
}
