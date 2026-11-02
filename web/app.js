import { summarizeAtlas, injuryBurden, regionBurden } from './synthesis.js';
import { createMovementExplorer, gaitReference } from './movement.js';

let language = 'es';
try { language = localStorage.getItem('sri-language') === 'en' ? 'en' : 'es'; } catch {}
let atlas;
let selected = 'ric';
let selectedDomain = 'running_kinematics';
let page = 0;
const pageSize = 8;
const chartChoices = { ric: 'STRIDE_RATE', competitive_runners: '2', european_football: 'compare' };
const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const t = (es, en) => language === 'es' ? es : en;
const number = (value, precision = 0) => Number(value).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision, useGrouping: true });
const sourceNames = { ric: 'RIC', competitive_runners: 'RUNNERS', european_football: 'FOOTBALL' };
const statuses = () => ({ available: t('Registrado', 'Recorded'), provisional: t('Provisional', 'Provisional'), different_construct: t('Otro constructo', 'Different construct'), not_available: t('No disponible', 'Not available') });
const movementExplorer = createMovementExplorer();
let gait;
gaitReference.then((value) => { gait = value; if (atlas) renderHero(); }).catch(() => {});
// Spanish display names for the original football labels shown in charts; the source label stays in tooltips and tables.
const LABELS_ES = { 'Hamstring injury': 'Lesión de isquiotibiales', 'Muscle injury': 'Lesión muscular', 'muscular problems': 'Problemas musculares', 'Knee injury': 'Lesión de rodilla', 'Ankle injury': 'Lesión de tobillo', 'Knock': 'Golpe', 'Calf injury': 'Lesión de gemelo', 'Thigh problems': 'Problemas de muslo', 'Cruciate ligament tear': 'Rotura de ligamento cruzado', 'Knee surgery': 'Cirugía de rodilla', 'Shoulder injury': 'Lesión de hombro', 'Femoral fracture': 'Fractura de fémur', 'Cerebral hemorrhage': 'Hemorragia cerebral', 'Cruciate ligament surgery': 'Cirugía de ligamento cruzado', 'Cruciate ligament injury': 'Lesión de ligamento cruzado', 'Cartilage damage': 'Daño de cartílago', 'Patellar tendon rupture': 'Rotura del tendón rotuliano', 'Broken leg': 'Fractura de pierna', 'Achilles tendon rupture': 'Rotura del tendón de Aquiles', 'Knee problems': 'Problemas de rodilla', 'Adductor pain': 'Dolor de aductores' };
const labelName = (raw) => language === 'es' ? (LABELS_ES[raw] || raw) : raw;
// Short forms for the phone slope chart only; full names stay in the caption and on wider screens.
const SHORT_LABELS = { 'Hamstring injury': ['Isquiotibiales', 'Hamstring'], 'Muscle injury': ['L. muscular', 'Muscle injury'], 'muscular problems': ['Prob. muscular', 'Muscle probl.'], 'Knee injury': ['L. rodilla', 'Knee injury'], 'Ankle injury': ['L. tobillo', 'Ankle injury'], 'Cruciate ligament tear': ['Lig. cruzado', 'Cruciate tear'], 'Knee surgery': ['Cir. rodilla', 'Knee surgery'], 'Calf injury': ['L. gemelo', 'Calf injury'] };
const shortName = (raw) => { const pair = SHORT_LABELS[raw]; if (pair) return pair[language === 'es' ? 0 : 1]; const full = labelName(raw); return full.length > 14 ? `${full.slice(0, 13)}…` : full; };
const LICENCES_ES = { 'Upstream dataset CC BY 4.0; preserve project attribution notices': 'Datos de origen CC BY 4.0; se conservan los avisos de atribución del proyecto.', 'Primary dataset and dedicated tabular exports CC0; see source rights inventory': 'Datos primarios y exportaciones tabulares CC0; ver el inventario de derechos de la fuente.', 'Derived data CC BY-SA 4.0; preserve source attribution and transformations': 'Datos derivados CC BY-SA 4.0; se conservan la atribución y las transformaciones.' };
const licence = (value) => language === 'es' ? (LICENCES_ES[value] || value) : value;

function renderSynthesis() {
  const container = $('#conclusion-results');
  if (!container) return;
  const facts = summarizeAtlas(atlas);
  const cards = [
    {
      tag: t('01 / MOVIMIENTO', '01 / MOVEMENT'), title: t('Medir movimiento todavía no identifica una lesión.', 'Measuring movement does not yet identify injury.'),
      result: t(`Cadencia mediana: ${number(facts.stepsPerMinute, 0)} pasos/min (${number(facts.strideLeft, 2)} zancadas/min por lado) en ${facts.pilotN} personas.`, `Median cadence: ${number(facts.stepsPerMinute, 0)} steps/min (${number(facts.strideLeft, 2)} strides/min per side) in ${facts.pilotN} people.`),
      meaning: t('Describe mediciones y su calidad. No compara grupos con y sin lesión.', 'It describes measurements and their quality. It does not compare injured and uninjured groups.'), link: '#movement', linkLabel: t('Explorar movimiento', 'Explore movement'),
    },
    {
      tag: t('02 / ENTRENAMIENTO', '02 / TRAINING'), title: t('La historia de carga no se distingue con claridad del azar.', 'Training history is not clearly distinguishable from chance.'),
      result: t(`AP ${number(facts.averagePrecision, 4)} (IC ${number(facts.apLow, 4)} a ${number(facts.apHigh, 4)}) frente a ${number(facts.positiveFraction, 4)} del azar. ROC-AUC ${number(facts.rocAuc, 3)}.`, `AP ${number(facts.averagePrecision, 4)} (CI ${number(facts.apLow, 4)} to ${number(facts.apHigh, 4)}) against ${number(facts.positiveFraction, 4)} for chance. ROC-AUC ${number(facts.rocAuc, 3)}.`),
      meaning: t('Atletas nuevos y periodo futuro. El intervalo incluye el azar: no sirve como alerta clínica.', 'Unseen athletes, future period. The interval includes chance: not usable as a clinical alert.'), link: '#studies', linkLabel: t('Ver la evaluación', 'View the evaluation'),
    },
    {
      tag: t('03 / CONSECUENCIAS', '03 / CONSEQUENCES'), title: t('Lo más frecuente no acumula la mayor carga.', 'The most frequent label does not have the greatest burden.'),
      result: t(`${labelName(facts.mostFrequent.injury_type_raw)}: ${number(facts.mostFrequent.injury_count)} registros. ${labelName(facts.greatestBurden.injury_type_raw)}: ${number(facts.greatestBurden.injury_count)} registros, pero ${number(facts.greatestBurden.total_days_out)} días (~${number(facts.burdenGap * 100)} % más).`, `${facts.mostFrequent.injury_type_raw}: ${number(facts.mostFrequent.injury_count)} records. ${facts.greatestBurden.injury_type_raw}: ${number(facts.greatestBurden.injury_count)} records but ${number(facts.greatestBurden.total_days_out)} days (~${number(facts.burdenGap * 100)}% more).`),
      meaning: t('Solo lesiones: se excluyen enfermedades y otras ausencias. Las sumas pueden contar días dos veces.', 'Injuries only: illness and other absences excluded. Sums can count days twice.'), link: '#studies', linkLabel: t('Comparar frecuencia y días', 'Compare frequency and days'),
    },
  ];
  container.innerHTML = cards.map((card, index) => `<article class="finding-card finding-${index}"><span class="finding-tag">${card.tag}</span><h3>${card.title}</h3><p class="finding-result">${card.result}</p><p>${card.meaning}</p><a href="${card.link}"${index > 0 ? ` data-open-study="${index === 1 ? 'competitive_runners' : 'european_football'}"` : ''}>${card.linkLabel} ↗</a></article>`).join('');
  container.querySelectorAll('[data-open-study]').forEach((link) => link.addEventListener('click', () => { selected = link.dataset.openStudy; renderStudy(); }));
}

function renderHero() {
  const box = $('#hero-results');
  if (!box || !atlas) return;
  const facts = summarizeAtlas(atlas);
  let movement = `<p class="mini-wait">${t('Cargando curva…', 'Loading curve…')}</p>`;
  if (gait) {
    const knee = gait.knee; const w = 300; const h = 86; const x = (i) => 6 + (w - 12) * i / 100; const y = (v) => 8 + (h - 22) * (100 - v) / 100;
    const band = knee.mean.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m + knee.sd[i]).toFixed(1)}`).join('') + knee.mean.map((m, i) => i).reverse().map((i) => `L${x(i).toFixed(1)} ${y(knee.mean[i] - knee.sd[i]).toFixed(1)}`).join('') + 'Z';
    const line = knee.mean.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m).toFixed(1)}`).join('');
    const pilot = Math.abs(Number(atlas.charts.ric_pilot_descriptives.find((row) => row.feature === 'KNEE_FLEX_PEAK_ANGLE' && row.side === 'left').median));
    movement = `<svg viewBox="0 0 ${w} ${h}" class="mini-plot" aria-hidden="true"><rect x="${x(0)}" y="8" width="${x(gait.toe_off_pct_median) - x(0)}" height="${h - 22}" fill="#f0b98f14"/><path d="${band}" fill="#bdea8526"/><path class="mini-draw" pathLength="1" d="${line}" stroke="#bdea85" stroke-width="2.5" fill="none"/><path d="M${x(4)} ${y(pilot)}H${x(30)}" stroke="#f0b98f" stroke-width="3"/><text x="${x(4)}" y="${y(pilot) - 7}" class="mini-text peach">${t('piloto RIC', 'RIC pilot')} ${number(pilot, 0)}°</text><text x="${x(0)}" y="${h - 2}" class="mini-text">${t('apoyo', 'stance')}</text><text x="${x(100)}" y="${h - 2}" text-anchor="end" class="mini-text">${t('ciclo 100 %', 'cycle 100%')}</text></svg>`;
  }
  const runners = atlas.charts.runners_primary_validation.find((row) => row.Validation === 'Unseen athletes / future period');
  const rx = (v) => 6 + 288 * Number(v) / .05;
  const training = `<svg viewBox="0 0 300 84" class="mini-plot" aria-hidden="true"><path d="M${rx(facts.positiveFraction)} 14V58" stroke="#e8edf0" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${rx(facts.positiveFraction) - 4}" y="12" text-anchor="end" class="mini-text">${t('azar', 'chance')} ${number(facts.positiveFraction, 4)}</text><path class="mini-grow" d="M${rx(runners['AP CI low'])} 40H${rx(runners['AP CI high'])}" stroke="#9fc7f1" stroke-width="5" stroke-linecap="round"/><circle cx="${rx(facts.averagePrecision)}" cy="40" r="7" fill="#9fc7f1"/><text x="${rx(runners['AP CI high'])}" y="28" text-anchor="end" class="mini-text blue">AP ${number(facts.averagePrecision, 4)}</text><path d="M6 66H294" stroke="#34434a"/>${[0, .01, .02, .03, .04, .05].map((v) => `<text x="${rx(v)}" y="82" text-anchor="middle" class="mini-text">${number(v, 2)}</text>`).join('')}</svg>`;
  const ham = facts.mostFrequent; const acl = facts.greatestBurden;
  const pair = (label, a, b, y, max) => `<text x="0" y="${y - 6}" class="mini-text">${label}</text><rect class="mini-bar" x="0" y="${y}" width="${(220 * a / max).toFixed(1)}" height="9" rx="2" fill="#f0b98f"/><text x="${(220 * a / max + 6).toFixed(1)}" y="${y + 9}" class="mini-text">${number(a)}</text><rect class="mini-bar" x="0" y="${y + 12}" width="${(220 * b / max).toFixed(1)}" height="9" rx="2" fill="#ff8f5c"/><text x="${(220 * b / max + 6).toFixed(1)}" y="${y + 21}" class="mini-text">${number(b)}</text>`;
  const consequences = `<svg viewBox="0 0 300 84" class="mini-plot" aria-hidden="true">${pair(t('Registros', 'Records'), Number(ham.injury_count), Number(acl.injury_count), 14, Number(ham.injury_count))}${pair(t('Días de baja', 'Days absent'), Number(ham.total_days_out), Number(acl.total_days_out), 58, Number(acl.total_days_out))}</svg><p class="mini-key"><i class="k1"></i>${escape(labelName(ham.injury_type_raw))} <i class="k2"></i>${escape(labelName(acl.injury_type_raw))}</p>`;
  const cards = [
    [t('01 / MOVIMIENTO', '01 / MOVEMENT'), t('Rodilla en carrera: curva publicada (n = 28) y pico del piloto RIC', 'Running knee: published curve (n = 28) and RIC pilot peak'), movement],
    [t('02 / ENTRENAMIENTO', '02 / TRAINING'), t('Atletas nuevos: el intervalo de AP incluye el azar', 'Unseen athletes: the AP interval includes chance'), training],
    [t('03 / CONSECUENCIAS', '03 / CONSEQUENCES'), t(`Menos registros, ~${number(facts.burdenGap * 100)} % más días`, `Fewer records, ~${number(facts.burdenGap * 100)}% more days`), consequences],
  ];
  box.innerHTML = cards.map(([tag, title, plot]) => `<article class="hero-mini"><span class="finding-tag">${tag}</span><h3>${title}</h3>${plot}</article>`).join('');
}

function renderRegions() {
  const box = $('#region-result');
  if (!box) return;
  const { totals, regions } = regionBurden(atlas);
  const joints = { knee: t('rodilla', 'knee'), ankle_foot: t('tobillo', 'ankle'), hip_groin: t('cadera', 'hip'), thigh: t('entre cadera y rodilla', 'between hip and knee'), lower_leg: t('entre rodilla y tobillo', 'between knee and ankle') };
  const ordered = [...regions].sort((a, b) => b.days - a.days);
  const knee = regions.find((region) => region.id === 'knee');
  const assigned = regions.reduce((sum, region) => sum + region.records, 0);
  const max = Math.max(...regions.map((region) => Math.max(region.recordShare, region.dayShare)));
  const w = 360; const bw = (v) => 290 * v / max; const step = 66;
  const rows = ordered.map((region, index) => { const y = 40 + index * step; return `<g class="region-row"><text x="0" y="${y}" class="region-name">${escape(region[language])}</text><text x="${w}" y="${y}" text-anchor="end" class="region-mean">${number(region.meanDays, 0)} ${t('días/reg.', 'days/rec.')}</text><text x="0" y="${y + 14}" class="region-joint">${t('RIC mide:', 'RIC measures:')} ${joints[region.id]}</text><rect x="0" y="${y + 21}" width="${bw(region.recordShare).toFixed(1)}" height="9" rx="2" fill="#9fc7f1"/><text x="${bw(region.recordShare) + 6}" y="${y + 30}" class="region-value">${number(region.recordShare * 100, 1)} %</text><rect x="0" y="${y + 33}" width="${bw(region.dayShare).toFixed(1)}" height="9" rx="2" fill="#f0b98f"/><text x="${bw(region.dayShare) + 6}" y="${y + 42}" class="region-value">${number(region.dayShare * 100, 1)} %</text></g>`; }).join('');
  const height = 40 + ordered.length * step - 14;
  const left = 0;
  box.innerHTML = `<div class="region-copy"><p class="eyebrow">${t('NUEVO / PUENTE DESCRIPTIVO', 'NEW / DESCRIPTIVE BRIDGE')}</p><h3>${t(`La rodilla es el ${number(knee.recordShare * 100, 0)} % de los registros de lesión y el ${number(knee.dayShare * 100, 0)} % de los días de baja.`, `The knee is ${number(knee.recordShare * 100, 0)}% of injury records and ${number(knee.dayShare * 100, 0)}% of days absent.`)}</h3><p>${t('Agrupamos las etiquetas del fútbol por región corporal y las ponemos junto a las articulaciones que mide el piloto RIC. Es la misma pregunta vista desde dos fuentes: qué mide la biomecánica y dónde se concentra el coste de la ausencia.', 'We grouped football labels by body region and placed them next to the joints measured in the RIC pilot. One question seen from two sources: what biomechanics measures and where the cost of absence concentrates.')}</p><p class="scope-note">${t(`Poblaciones distintas: no es una relación causal ni individual. Agrupación por palabras clave de la etiqueta original; ${number(100 * (1 - assigned / totals.records), 0)} % de los registros (por ejemplo «Muscle injury») no nombran región y quedan fuera. Las sumas pueden contar días dos veces.`, `Different populations: not a causal or individual relationship. Grouping by keywords in the original label; ${number(100 * (1 - assigned / totals.records), 0)}% of records (for example "Muscle injury") name no region and are left out. Sums can double count days.`)}</p></div><figure class="region-chart"><svg viewBox="0 0 ${w} ${height}" role="img" aria-label="${escape(t('Porcentaje de registros y de días de baja por región corporal en el fútbol', 'Share of records and days absent by body region in football'))}"><text x="0" y="12" class="region-head">■ ${t('% REGISTROS', '% RECORDS')}</text><text x="128" y="12" class="region-head peach">■ ${t('% DÍAS DE BAJA', '% DAYS ABSENT')}</text>${rows}</svg><figcaption>${t(`Base: ${number(totals.records)} registros de lesión y ${number(totals.days)} días. Media = días sumados / registros.`, `Base: ${number(totals.records)} injury records and ${number(totals.days)} days. Mean = summed days / records.`)}</figcaption></figure>`;
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
  if ($('#runner-desc')) $('#runner-desc').textContent = t('Corredor animado con los ángulos medios publicados de cadera, rodilla y tobillo a 2,5 m/s (Fukuchi y colaboradores, 2017). Pelvis, tronco, brazos y altura de vuelo son ilustrativos.', 'Runner animated with published mean hip, knee and ankle angles at 2.5 m/s (Fukuchi et al., 2017). Pelvis, trunk, arms and flight height are illustrative.');
  $('#motion')?.setAttribute('aria-label', t('Pausar o reanudar las animaciones', 'Pause or resume animations'));
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

function intervalPlot(rows, names, active) {
  const max = Math.max(...rows.map((row) => Number(row['AP CI high']))) * 1.1;
  const x = (value) => 8 + 290 * Number(value) / max;
  const rowHeight = 58;
  const ticks = [0, .01, .02, .03, .04].filter((tick) => tick <= max);
  const body = rows.map((row, index) => {
    const y = 40 + index * rowHeight;
    const ap = Number(row['Pooled AP']); const base = Number(row['Label fraction']);
    const on = index === active;
    const color = on ? '#9fc7f1' : '#5f7884';
    const lift = ap / base;
    return `<g class="ci-row${on ? ' active' : ''}"><text x="0" y="${y - 16}" class="ci-label">${escape(names[index])}</text><path d="M${x(base)} ${y - 16}V${y + 16}" stroke="#e8edf0" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M${x(row['AP CI low'])} ${y}H${x(row['AP CI high'])}" stroke="${color}" stroke-width="${on ? 4 : 2}" stroke-linecap="round"/><circle cx="${x(ap)}" cy="${y}" r="${on ? 7 : 5}" fill="${color}"/><text x="${x(row['AP CI high']) + 8}" y="${y + 4}" class="ci-value">×${number(lift, 2)}</text></g>`;
  }).join('');
  const height = 34 + rows.length * rowHeight;
  const axis = ticks.map((tick) => `<g><path d="M${x(tick)} ${height - 18}V${height - 12}" stroke="#65797b"/><text x="${x(tick)}" y="${height}" text-anchor="middle" class="ci-axis">${number(tick, 2)}</text></g>`).join('');
  return `<svg class="ci-plot" viewBox="0 0 360 ${height + 6}" role="img" aria-label="${escape(t('Precisión media (AP) con intervalo de confianza frente a la referencia del azar en tres validaciones; valores en la tabla siguiente', 'Average precision with confidence interval versus the chance reference in three validations; values in the following table'))}">${body}<path d="M8 ${height - 18}H298" stroke="#34434a"/>${axis}</svg><p class="ci-legend"><span class="ci-key dot-key"></span>${t('AP del modelo', 'Model AP')}<span class="ci-key line-key"></span>${t('Azar (fracción positiva)', 'Chance (positive fraction)')}<span class="ci-key lift-key">×</span>${t('veces sobre el azar', 'times over chance')}</p>`;
}

const narrow = () => matchMedia('(max-width: 750px)').matches;

function slopeChart(burden) {
  const byCount = [...burden].sort((a, b) => Number(b.injury_count) - Number(a.injury_count));
  const byDays = [...burden].sort((a, b) => Number(b.total_days_out) - Number(a.total_days_out));
  const pick = [...new Set([...byCount.slice(0, 5), ...byDays.slice(0, 5)].map((row) => row.injury_type_raw))];
  const rows = burden.filter((row) => pick.includes(row.injury_type_raw));
  const leftOrder = [...rows].sort((a, b) => Number(b.injury_count) - Number(a.injury_count)).map((row) => row.injury_type_raw);
  const rightOrder = [...rows].sort((a, b) => Number(b.total_days_out) - Number(a.total_days_out)).map((row) => row.injury_type_raw);
  const compact = narrow();
  // Compact layout (phones): name above its count on the left, days on the right, so text stays legible at 390 px.
  const W = compact ? 360 : 540; const L = compact ? 120 : 200; const R = compact ? 240 : 340; const step = compact ? 44 : 34;
  const y = (index) => 48 + index * step;
  const height = y(rows.length - 1) + 24;
  const highlight = { [leftOrder[0]]: '#f0b98f', [rightOrder[0]]: '#ff8f5c' };
  const lines = rows.map((row) => {
    const name = row.injury_type_raw; const color = highlight[name] || '#4d5f66'; const strong = Boolean(highlight[name]);
    const ly = y(leftOrder.indexOf(name)); const ry = y(rightOrder.indexOf(name));
    const labels = compact
      ? `<text x="${L - 10}" y="${ly - 2}" text-anchor="end" class="slope-text">${escape(shortName(name))}</text><text x="${L - 10}" y="${ly + 13}" text-anchor="end" class="slope-count">${number(row.injury_count)}</text><text x="${R + 10}" y="${ry - 2}" class="slope-text">${escape(shortName(name))}</text><text x="${R + 10}" y="${ry + 13}" class="slope-count">${number(row.total_days_out)}</text>`
      : `<text x="${L - 10}" y="${ly + 4}" text-anchor="end" class="slope-text">${escape(labelName(name))} · ${number(row.injury_count)}</text><text x="${R + 10}" y="${ry + 4}" class="slope-text">${number(row.total_days_out)} · ${escape(labelName(name))}</text>`;
    return `<g class="slope-row${strong ? ' strong' : ''}"><path d="M${L} ${ly}L${R} ${ry}" stroke="${color}" stroke-width="${strong ? 3 : 1.5}" fill="none"/><circle cx="${L}" cy="${ly}" r="${strong ? 5 : 3.5}" fill="${color}"/><circle cx="${R}" cy="${ry}" r="${strong ? 5 : 3.5}" fill="${color}"/>${labels}</g>`;
  }).join('');
  const gap = number(100 * (Number(burden.find((row) => row.injury_type_raw === rightOrder[0]).total_days_out) / Number(burden.find((row) => row.injury_type_raw === leftOrder[0]).total_days_out) - 1));
  return `<svg class="slope-plot${compact ? ' compact' : ''}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${escape(t('Orden de las etiquetas por número de registros y por días de ausencia acumulados', 'Label ranking by number of records and by summed absence days'))}"><text x="${L}" y="18" text-anchor="${compact ? 'end' : 'middle'}" class="slope-head">${t('REGISTROS', 'RECORDS')}</text><text x="${R}" y="18" text-anchor="${compact ? 'start' : 'middle'}" class="slope-head">${t('DÍAS', 'DAYS')}</text>${lines}</svg><p class="chart-caption">${t(`Cada línea une la posición de una etiqueta en las dos medidas. ${escape(labelName(leftOrder[0]))} es la más frecuente, pero ${escape(labelName(rightOrder[0]))} acumula ~${gap} % más días con muchos menos registros.`, `Each line joins a label's position under both measures. ${escape(leftOrder[0])} is the most frequent, but ${escape(rightOrder[0])} accumulates ~${gap}% more days with far fewer records.`)}</p>`;
}

function chart() {
  if (selected === 'ric') {
    const feature = chartChoices.ric;
    const features = [...new Set(atlas.charts.ric_pilot_descriptives.map((row) => row.feature))];
    const rows = atlas.charts.ric_pilot_descriptives.filter((row) => row.feature === feature);
    const side = (value) => value === 'left' ? t('Izquierdo', 'Left') : t('Derecho', 'Right');
    return `<h3 class="chart-title">${t('Piloto biomecánico · mediana por lado', 'Biomechanical pilot · median by side')}</h3><p class="chart-meta">n = 30 / ${escape(rows[0].unit)} / ${t('escalares de origen', 'source scalars')}</p><label for="chart-choice">${t('Variable', 'Variable')}<select id="chart-choice">${features.map((name) => `<option value="${escape(name)}"${name === feature ? ' selected' : ''}>${escape(name)}</option>`).join('')}</select></label>${quartilePlot(rows, side)}${table([t('Lado', 'Side'), 'n', t('Mediana', 'Median'), 'Q1', 'Q3', t('Mín.', 'Min'), t('Máx.', 'Max')], rows.map((row) => [side(row.side), row.n, number(row.median, 3), number(row.q1, 3), number(row.q3, 3), number(row.minimum, 3), number(row.maximum, 3)]))}<p class="chart-caption">${feature === 'STRIDE_RATE' ? t(`Una zancada son dos pasos: ${number(rows[0].median, 2)} zancadas/min equivalen a unos ${number(2 * Number(rows[0].median), 0)} pasos/min. `, `One stride is two steps: ${number(rows[0].median, 2)} strides/min is about ${number(2 * Number(rows[0].median), 0)} steps/min. `) : ''}${t('Línea verde: mediana. Franja: Q1 a Q3. Extremos: mínimo y máximo. Sin comparación por lesión ni umbrales clínicos. Cada variable conserva la escala y el signo de la fuente.', 'Green line: median. Band: Q1 to Q3. Ends: minimum and maximum. No injury comparison or clinical thresholds. Each variable keeps the source scale and sign.')} (${escape(rows[0].unit)})</p>`;
  }
  if (selected === 'competitive_runners') {
    const protocols = [t('Atletas conocidos / futuro', 'Known athletes / future'), t('Atletas nuevos / todos los periodos', 'Unseen athletes / all periods'), t('Atletas nuevos / futuro', 'Unseen athletes / future')];
    const row = atlas.charts.runners_primary_validation[Number(chartChoices.competitive_runners)];
    const ap = Number(row['Pooled AP']);
    const fraction = Number(row['Label fraction']);
    return `<h3 class="chart-title">${t('¿Supera el modelo al azar?', 'Does the model beat chance?')}</h3><p class="chart-meta">${t('Evaluación primaria guardada · sin reentrenamiento', 'Saved primary evaluation · no retraining')}</p><label for="chart-choice">${t('Validación', 'Validation')}<select id="chart-choice">${protocols.map((name, index) => `<option value="${index}"${String(index) === chartChoices.competitive_runners ? ' selected' : ''}>${name}</option>`).join('')}</select></label>${intervalPlot(atlas.charts.runners_primary_validation, protocols, Number(chartChoices.competitive_runners))}${table([t('Métrica', 'Metric'), t('Valor', 'Value')], [[t('Precisión media (AP)', 'Average precision (AP)'), number(ap, 4)], [t('Intervalo de AP', 'AP interval'), `${number(row['AP CI low'], 4)} ${t('a', 'to')} ${number(row['AP CI high'], 4)}`], [t('Azar (fracción positiva)', 'Chance (positive fraction)'), number(fraction, 4)], [t('Filas de test', 'Test rows'), number(row.Rows)], [t('Etiquetas positivas', 'Positive labels'), number(row.Labels)], ['ROC-AUC', number(row['ROC-AUC'], 3)], ['Brier', number(row.Brier, 5)]] )}<p class="chart-caption">${t('Punto: AP del modelo. Barra: su intervalo de confianza. Línea discontinua: AP esperada al azar. En atletas nuevos y periodo futuro el intervalo cruza la línea: el modelo no se distingue con claridad del azar (lectura visual, no prueba formal). Los controles se eligieron usando aptitud futura.', 'Dot: model AP. Bar: its confidence interval. Dashed line: AP expected by chance. For unseen athletes in a future period the interval crosses the line: the model is not clearly distinguishable from chance (visual reading, not a formal test). Controls were selected using future fitness.')}</p>`;
  }
  const options = { compare: t('Frecuencia frente a días de ausencia', 'Frequency versus days absent'), distribution: t('Distribución de días por registro', 'Days per record distribution'), injury_count: t('Frecuencia registrada', 'Recorded frequency'), median_days_out: t('Mediana de duración', 'Median duration'), total_days_out: t('Suma de días por registro', 'Sum of episode-days') };
  const metric = chartChoices.european_football;
  const burden = injuryBurden(atlas);
  const picker = `<label for="chart-choice">${t('Medida', 'Measure')}<select id="chart-choice">${Object.entries(options).map(([key, label]) => `<option value="${key}"${key === metric ? ' selected' : ''}>${label}</option>`).join('')}</select></label>`;
  const filterNote = t(`Solo lesiones: ${number(burden.length)} etiquetas y ${number(summarizeAtlas(atlas).injuryRecords)} registros. Se excluyen ${number(atlas.charts.football_burden.length - burden.length)} etiquetas de enfermedad, infección, cuarentena, descanso u otras ausencias no lesivas (por ejemplo «Corona virus»).`, `Injuries only: ${number(burden.length)} labels and ${number(summarizeAtlas(atlas).injuryRecords)} records. ${number(atlas.charts.football_burden.length - burden.length)} illness, infection, quarantine, rest or other non-injury labels are excluded (for example "Corona virus").`);
  if (metric === 'compare') return `<h3 class="chart-title">${t('Lo más frecuente no es lo que más días cuesta', 'The most frequent is not the most costly in days')}</h3><p class="chart-meta">${t('registros frente a días-episodio · solo lesiones', 'records versus episode-days · injuries only')}</p>${picker}${slopeChart(burden)}<p class="chart-caption">${filterNote} ${t('Las sumas pueden contar dos veces días de registros solapados.', 'Sums can double count days from overlapping records.')}</p>`;
  if (metric === 'distribution') return `<h3 class="chart-title">${t('¿Cuántos días dura cada registro?', 'How many days does each record last?')}</h3><p class="chart-meta">${t('ocho etiquetas más frecuentes · días por registro', 'eight most frequent labels · days per record')}</p>${picker}${distributionPlot(burden)}<p class="chart-caption">${t('Caja: percentiles 25 a 75. Línea: mediana. Bigote: percentil 90. Las etiquetas más frecuentes tienen ausencias cortas; la rodilla tiene la cola más larga.', 'Box: 25th to 75th percentile. Line: median. Whisker: 90th percentile. The most frequent labels have short absences; the knee has the longest tail.')} ${filterNote}</p>`;
  const rows = [...burden].sort((a, b) => Number(b[metric]) - Number(a[metric])).slice(0, 5);
  const units = metric === 'injury_count' ? t('registros', 'records') : metric === 'median_days_out' ? t('días / registro', 'days / record') : t('días-episodio', 'episode-days');
  return `<h3 class="chart-title">${t('Etiquetas de lesión · cinco primeras', 'Injury labels · top five')}</h3><p class="chart-meta">${escape(units)} · ${t('solo lesiones', 'injuries only')}</p>${picker}${bars(rows.map((row) => ({ label: labelName(row.injury_type_raw), value: Number(row[metric]), display: number(row[metric], metric === 'median_days_out' ? 1 : 0) })), Math.max(...rows.map((row) => Number(row[metric]))) * 1.05, '#f0b98f')}${table([t('Etiqueta original', 'Original label'), 'n', options[metric]], rows.map((row) => [row.injury_type_raw, number(row.injury_count), number(row[metric], metric === 'median_days_out' ? 1 : 0)]))}${table([t('Sensibilidad (todas las ausencias)', 'Sensitivity (all absences)'), t('Registros', 'Records')], atlas.charts.football_duplicate_sensitivity.map((row, index) => [index === 0 ? t('Fuente original', 'Source records') : t('Colapso candidato', 'Candidate collapsing'), number(row.record_count)]))}<p class="chart-caption">${filterNote} ${t('El colapso candidato no adjudica episodios. Las sumas pueden contar dos veces días y partidos. Revisa n antes de leer medianas de etiquetas raras.', 'Candidate collapsing does not adjudicate episodes. Sums can double count days and matches. Check n before reading rare-label medians.')}</p>`;
}

function distributionPlot(burden) {
  const rows = [...burden].sort((a, b) => Number(b.injury_count) - Number(a.injury_count)).slice(0, 8);
  const max = Math.ceil(Math.max(...rows.map((row) => Number(row.p90_days_out))) / 20) * 20;
  const left = 150; const width = 360; const x = (value) => left + (width - left - 14) * Number(value) / max; const step = 30;
  const body = rows.map((row, index) => { const y = 26 + index * step; return `<g><text x="${left - 8}" y="${y + 4}" text-anchor="end" class="dist-label">${escape(labelName(row.injury_type_raw))}</text><path d="M${x(row.p75_days_out)} ${y}H${x(row.p90_days_out)}" stroke="#8a9da3" stroke-width="1.5"/><path d="M${x(row.p90_days_out)} ${y - 5}V${y + 5}" stroke="#8a9da3" stroke-width="1.5"/><rect x="${x(row.p25_days_out)}" y="${y - 7}" width="${x(row.p75_days_out) - x(row.p25_days_out)}" height="14" rx="2" fill="#f0b98f44" stroke="#f0b98f"/><path d="M${x(row.median_days_out)} ${y - 9}V${y + 9}" stroke="#f0f2ec" stroke-width="2.5"/></g>`; }).join('');
  const bottom = 26 + rows.length * step;
  const ticks = [0, max / 4, max / 2, 3 * max / 4, max].map((tick) => `<path d="M${x(tick)} 12V${bottom - 10}" stroke="#24343b"/><text x="${x(tick)}" y="${bottom + 6}" text-anchor="middle" class="ci-axis">${number(tick)}</text>`).join('');
  return `<svg class="dist-plot" viewBox="0 0 ${width} ${bottom + 12}" role="img" aria-label="${escape(t('Percentiles de días de ausencia por registro para las ocho etiquetas de lesión más frecuentes', 'Days absent per record percentiles for the eight most frequent injury labels'))}">${ticks}${body}</svg>${table([t('Etiqueta original', 'Original label'), 'n', 'P25', t('Mediana', 'Median'), 'P75', 'P90'], rows.map((row) => [row.injury_type_raw, number(row.injury_count), number(row.p25_days_out), number(row.median_days_out), number(row.p75_days_out), number(row.p90_days_out)]))}`;
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
      finding: t(`STRIDE_RATE tiene una mediana de ${number(findings.strideLeft, 2)} zancadas/min en ambos lados, unos ${number(findings.stepsPerMinute, 0)} pasos/min. Medianas iguales no demuestran simetría individual ni normalidad clínica.`, `Median STRIDE_RATE is ${number(findings.strideLeft, 2)} strides/min on both sides, about ${number(findings.stepsPerMinute, 0)} steps/min. Equal group medians do not establish individual symmetry or clinical normality.`),
      conclusion: t('Aporta una base descriptiva del movimiento y sus convenciones. El siguiente paso es validar eventos/ciclos antes de inferir diferencias biomecánicas por lesión.', 'It provides a descriptive movement baseline and its conventions. The next step is event/cycle validation before inferring injury-related biomechanical differences.'),
      paper: 'https://doi.org/10.1038/s41597-024-04011-7', paperLabel: t('Descriptor científico de la fuente', 'Scientific source descriptor'),
    },
    competitive_runners: {
      title: t('El entrenamiento antes de la etiqueta.', 'Training before the label.'),
      description: t('Historias de carga, descanso y respuesta subjetiva anteriores a eventos seleccionados. La evaluación distingue tiempo futuro, atletas nuevos y la combinación de ambos.', 'Load, rest and subjective-response histories before selected events. Evaluation distinguishes future time, unseen athletes and both together.'),
      metrics: [['74', t('atletas', 'athletes')], [number(42766), t('registros diarios seleccionados', 'selected daily records')], ['583', t('etiquetas retenidas', 'retained labels')]],
      note: t('Los controles se seleccionaron usando aptitud futura. La proporción de etiquetas y el rendimiento en test dependen de esa muestra; no son riesgo clínico ni incidencia.', 'Controls were selected using future fitness. Label fraction and test performance depend on that sample; they are not clinical risk or incidence.'),
      slug: 'competitive-runners-injury-risk',
      method: t('Reanálisis de 74 atletas con modelos logísticos fijos, calibración independiente y separación temporal y por atleta. Aquí se muestran los resultados primarios ya guardados.', 'Reanalysis of 74 athletes with fixed logistic models, independent calibration and temporal/athlete separation. This view presents saved primary results.'),
      finding: t(`Atletas nuevos y periodo futuro: ${number(findings.testLabels)} etiquetas en ${number(findings.testRows)} filas. AP ${number(findings.averagePrecision, 4)} con intervalo ${number(findings.apLow, 4)} a ${number(findings.apHigh, 4)}, frente a ${number(findings.positiveFraction, 4)} del azar; ROC-AUC ${number(findings.rocAuc, 3)}. No se distingue con claridad del azar.`, `Unseen athletes, future period: ${number(findings.testLabels)} labels in ${number(findings.testRows)} rows. AP ${number(findings.averagePrecision, 4)} with interval ${number(findings.apLow, 4)} to ${number(findings.apHigh, 4)}, against ${number(findings.positiveFraction, 4)} for chance; ROC-AUC ${number(findings.rocAuc, 3)}. Not clearly distinguishable from chance.`),
      conclusion: t('Las señales de entrenamiento no bastaron para establecer utilidad clínica. Evaluar atletas nuevos y tiempo futuro es una pregunta más exigente que describir asociaciones retrospectivas.', 'Training signals did not establish clinical utility. Evaluating unseen athletes and future time asks a more demanding question than describing retrospective associations.'),
      paper: 'https://doi.org/10.1123/ijspp.2020-0518', paperLabel: t('Estudio original · leer junto a su errata', 'Original study · read alongside its erratum'),
    },
    european_football: {
      title: t('El coste de estar ausente.', 'The cost of being absent.'),
      description: t('Registros de ausencia en cinco ligas europeas. Frecuencia, duración por registro y carga acumulada muestran caras distintas del impacto.', 'Absence records across five European leagues. Frequency, duration per record and cumulative burden describe distinct dimensions of recorded impact.'),
      metrics: [[number(findings.injuryRecords), t(`registros de lesión (de ${number(findings.allRecords)} ausencias)`, `injury records (of ${number(findings.allRecords)} absences)`)], ['5', t('ligas europeas', 'European leagues')], ['18', t('mediana de días / registro (todas las ausencias)', 'median days / record (all absences)')]],
      note: t('Los nombres no verifican identidad. No hay exposición elegible completa ni retorno clínico confirmado. Frecuencia de registros, carga acumulada y disponibilidad son conceptos distintos.', 'Names do not verify identity. Complete eligible exposure and verified clinical return are absent. Record frequency, cumulative burden and availability are different concepts.'),
      slug: 'european-football-injuries',
      method: t(`Análisis descriptivo por etiqueta original: frecuencia, duración y partidos perdidos. Los gráficos excluyen ${number(findings.excludedLabels)} etiquetas que no son lesiones (enfermedad, infección, cuarentena, descanso; por ejemplo «Corona virus»): quedan ${number(findings.injuryRecords)} de ${number(findings.allRecords)} registros. La vista de 14.611 registros es una sensibilidad al colapso de intervalos repetidos.`, `Descriptive original-label analysis: frequency, duration and matches missed. Charts exclude ${number(findings.excludedLabels)} non-injury labels (illness, infection, quarantine, rest; for example "Corona virus"), leaving ${number(findings.injuryRecords)} of ${number(findings.allRecords)} records. The 14,611-record view is a repeated-interval collapsing sensitivity.`),
      finding: t(`${labelName(findings.mostFrequent.injury_type_raw)}: ${number(findings.mostFrequent.injury_count)} registros y ${number(findings.mostFrequent.total_days_out)} días. ${labelName(findings.greatestBurden.injury_type_raw)}: ${number(findings.greatestBurden.injury_count)} registros y ${number(findings.greatestBurden.total_days_out)} días, ~${number(findings.burdenGap * 100)} % más. La diferencia es pequeña y las sumas pueden contar días dos veces.`, `${findings.mostFrequent.injury_type_raw}: ${number(findings.mostFrequent.injury_count)} records and ${number(findings.mostFrequent.total_days_out)} days. ${findings.greatestBurden.injury_type_raw}: ${number(findings.greatestBurden.injury_count)} records and ${number(findings.greatestBurden.total_days_out)} days, ~${number(findings.burdenGap * 100)}% more. The gap is small and sums can double count days.`),
      conclusion: t('Frecuencia, severidad por registro y carga acumulada cambian la lectura del impacto. No se debe convertir una clasificación por conteo en una clasificación por riesgo o disponibilidad.', 'Frequency, per-record severity and cumulative burden change the interpretation of impact. A record-count ranking must not become a risk or availability ranking.'),
      paper: 'https://doi.org/10.1136/bjsports-2019-101969', paperLabel: t('Consenso IOC para interpretar las medidas', 'IOC consensus for interpreting the measures'),
    },
  }[selected];
  panel.dataset.selected = selected;
  panel.innerHTML = `<div class="study-layout"><div class="study-copy"><h3>${content.title}</h3><p>${content.description}</p><div class="study-metrics">${content.metrics.map(([value, label]) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('')}</div><p class="scope-note">${content.note}</p><div class="study-links"><a href="https://${content.slug}.vercel.app" target="_blank" rel="noopener">${t('Explorar estudio', 'Explore study')} ↗</a><a href="https://victor-gomez-portfolio.vercel.app/projects/${content.slug}">${t('Caso en el portfolio', 'Portfolio case')} ↗</a><a href="https://github.com/victorgomezadapty/${content.slug}" target="_blank" rel="noopener">GitHub ↗</a></div><p class="chart-caption">${escape(licence(source.licence))}</p></div><div class="chart-panel">${chart()}</div></div>`;
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
  $('#catalog-results').innerHTML = rows.slice(page * pageSize, (page + 1) * pageSize).map((row) => `<details class="catalog-item"><summary><span class="catalog-variable">${escape(row.original_variable)} <span aria-hidden="true">+</span></span><span class="catalog-unit">${escape(row.units || '—')}</span><span class="source-badge ${row.source_id}">${sourceNames[row.source_id]}</span></summary><div class="catalog-detail" lang="en">${language === 'es' ? '<p class="source-text-note" lang="es">Texto original de la fuente, en inglés.</p>' : ''}<p>${escape(row.definition)}</p><p><strong>${t('Contexto', 'Context')}:</strong> ${escape(row.observation_context)} / ${escape(row.source_domain_or_role)}</p><p><strong>${t('Verificación / tiempo', 'Verification / timing')}:</strong> ${escape(row.timing_or_verification)}</p><p><strong>${t('Límite', 'Limitation')}:</strong> ${escape(row.limitations || t('Ver registro de desenlaces y metodología.', 'See outcome registry and methodology.'))}</p><pre>${escape(JSON.stringify(JSON.parse(row.original_definition_json), null, 2))}</pre></div></details>`).join('') || `<p class="no-results">${t('No hay resultados. Prueba otro término o fuente.', 'No results. Try another term or source.')}</p>`;
  $('#page-number').textContent = `${page + 1} / ${pages}`;
  $('#previous').disabled = page === 0;
  $('#next').disabled = page >= pages - 1;
}

function renderReferences() {
  if (!$('#references')) return;
  $('#references').innerHTML = atlas.references.map((reference, index) => `<article class="reference-item"><small>${String(index + 1).padStart(2, '0')} / ${escape(reference.type)}</small><h3><a href="${escape(reference.url)}" target="_blank" rel="noopener">${escape(reference.title)} ↗</a></h3><p>${escape(reference.authors)} · ${reference.year}</p><p>${escape(reference[`use_${language}`])}</p></article>`).join('');
}

function render() { renderHero(); renderRegions(); renderSynthesis(); renderStudy(); renderMatrix(); renderCatalog(); renderReferences(); movementExplorer?.update(atlas, language); }
$('#language')?.addEventListener('click', () => { language = language === 'es' ? 'en' : 'es'; try { localStorage.setItem('sri-language', language); } catch {} setLanguage(); });
$('#motion')?.addEventListener('click', () => { const paused = document.body.classList.toggle('motion-paused'); $('#motion').setAttribute('aria-pressed', String(paused)); updateMotionText(); });
document.querySelectorAll('[data-source]').forEach((button) => button.addEventListener('click', () => { selected = button.dataset.source; renderStudy(); }));
$('#search')?.addEventListener('input', () => { page = 0; renderCatalog(); });
$('#source-filter')?.addEventListener('change', () => { page = 0; renderCatalog(); });
$('#previous')?.addEventListener('click', () => { page--; renderCatalog(); });
$('#next')?.addEventListener('click', () => { page++; renderCatalog(); });
// Mobile: long reference blocks start collapsed; desktop and no-JS keep them open.
const compact = matchMedia('(max-width: 750px)');
function syncCollapsibles() { document.querySelectorAll('details.mobile-collapse').forEach((item) => { item.open = !compact.matches; }); }
syncCollapsibles();
compact.addEventListener('change', () => { syncCollapsibles(); if (atlas) { renderStudy(); renderRegions(); } });
// Sticky nav: highlight the section in view.
const navLinks = [...document.querySelectorAll('.header nav a[href^="#"]')];
const navObserver = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle('current', link.getAttribute('href') === `#${entry.target.id}`)); }, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((link) => { const target = document.querySelector(link.getAttribute('href')); if (target) navObserver.observe(target); });
document.querySelectorAll('.hero, #integration-result, #catalog, .roadmap-section, #release').forEach((element) => navObserver.observe(element));
// Scroll-in reveal, only when the user has not asked for reduced motion (CSS gates the effect too).
if (matchMedia('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const revealObserver = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); } }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.section-heading, .hero-results, .conclusion-grid, .joint-conclusion, .movement-layout, .study-tabs, .study-panel, .integration-steps, .region-result, .integration-answer, .roadmap, .release-section > div').forEach((element) => { element.classList.add('reveal'); revealObserver.observe(element); });
}
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
