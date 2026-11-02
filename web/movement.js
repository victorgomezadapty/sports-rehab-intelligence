// Joint angles come from published mean running curves (Fukuchi et al. 2017, RBDS, CC BY 4.0).
// The pelvis tilt, trunk and flight height are drawing choices; they are not measured data.
const PELVIS_TILT = 12; // display offset between hip angle and thigh orientation
const FLIGHT_LIFT = 6; // illustrative rise of the body during flight, in px
const GROUND = 375;
export const gaitReference = fetch('data/gait_reference.json').then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); });
const PILOT = { knee: 'KNEE_FLEX_PEAK_ANGLE', ankle: 'ANKLE_DF_PEAK_ANGLE', hip: 'HIP_EXT_PEAK_ANGLE' };

export function createMovementExplorer() {
  const svg = document.querySelector('#runner-scene');
  if (!svg) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { paused: reduced.matches, visible: false, phase: .12, joint: 'knee', language: 'es', atlas: null, gait: null, offsets: null };
  const joints = { hip: { es: 'Cadera', en: 'Hip' }, knee: { es: 'Rodilla', en: 'Knee' }, ankle: { es: 'Tobillo', en: 'Ankle' } };
  const select = (selector) => document.querySelector(selector);
  const text = (es, en) => state.language === 'es' ? es : en;
  const fmt = (value, digits = 1) => Number(value).toLocaleString(state.language === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const rad = (degrees) => degrees * Math.PI / 180;
  const turn = (x, y, degrees) => [x * Math.cos(rad(degrees)) - y * Math.sin(rad(degrees)), x * Math.sin(rad(degrees)) + y * Math.cos(rad(degrees))];
  const sample = (curve, phase) => { const position = ((phase % 1) + 1) % 1 * 100; const low = Math.floor(position); const high = Math.min(100, low + 1); return curve[low] + (curve[high] - curve[low]) * (position - low); };
  const inStance = (phase) => (((phase % 1) + 1) % 1) * 100 < state.gait.toe_off_pct_median;

  function leg(phase) {
    const g = state.gait;
    const hip = sample(g.hip.mean, phase); const knee = sample(g.knee.mean, phase); const ankle = sample(g.ankle.mean, phase);
    const thigh = -(hip - PELVIS_TILT); const shin = knee; const foot = -14 - ankle;
    const [kx, ky] = turn(0, 76, thigh); const kneePoint = [220 + kx, 205 + ky];
    const [ax, ay] = turn(0, 76, thigh + shin); const anklePoint = [kneePoint[0] + ax, kneePoint[1] + ay];
    const [tx, ty] = turn(32, 8, thigh + shin + foot); const toe = [anklePoint[0] + tx, anklePoint[1] + ty];
    return { hip, knee, ankle, thigh, shin, foot, kneePoint, anklePoint, lowest: Math.max(anklePoint[1] + 6, toe[1] + 6) };
  }
  function buildOffsets() {
    // Stance: the supporting foot stays on the ground. Flight: interpolate and add a small lift.
    const raw = Array.from({ length: 101 }, (_, index) => {
      const phase = index / 100;
      const supports = [[phase, leg(phase)], [phase + .5, leg(phase + .5)]].filter(([p]) => inStance(p));
      return supports.length ? GROUND - Math.max(...supports.map(([, pose]) => pose.lowest)) : null;
    });
    return raw.map((value, index) => {
      if (value !== null) return value;
      let before = index; while (raw[before] === null) before = (before + 100) % 101;
      let after = index; while (raw[after] === null) after = (after + 1) % 101;
      const span = ((after - before + 101) % 101) || 1; const s = ((index - before + 101) % 101) / span;
      return raw[before] + (raw[after] - raw[before]) * s - FLIGHT_LIFT * 4 * s * (1 - s);
    });
  }
  function arc(cx, cy, radius, from, to) {
    const point = (degrees) => { const [x, y] = turn(0, radius, degrees); return [cx + x, cy + y]; };
    const [x1, y1] = point(from); const [x2, y2] = point(to);
    return `M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${radius} ${radius} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to > from ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
  }
  function pilotRows() { return state.atlas ? state.atlas.charts.ric_pilot_descriptives.filter((row) => row.feature === PILOT[state.joint]) : []; }

  function renderCurve() {
    const box = select('#movement-curve'); if (!box || !state.gait) return;
    const g = state.gait; const curve = g[state.joint]; const width = 360; const height = 170; const left = 34; const right = 10; const top = 14; const bottom = 26;
    const values = curve.mean.flatMap((m, i) => [m - curve.sd[i], m + curve.sd[i]]);
    const low = Math.floor(Math.min(...values) / 10) * 10; const high = Math.ceil(Math.max(...values) / 10) * 10;
    const x = (i) => left + (width - left - right) * i / 100; const y = (v) => top + (height - top - bottom) * (high - v) / (high - low);
    const line = curve.mean.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m).toFixed(1)}`).join('');
    const band = curve.mean.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m + curve.sd[i]).toFixed(1)}`).join('') + curve.mean.map((m, i) => i).reverse().map((i) => `L${x(i).toFixed(1)} ${y(curve.mean[i] - curve.sd[i]).toFixed(1)}`).join('') + 'Z';
    const toe = g.toe_off_pct_median;
    const ticks = []; for (let v = low; v <= high; v += (high - low) > 60 ? 20 : 10) ticks.push(`<text x="${left - 6}" y="${y(v) + 4}" text-anchor="end" class="curve-axis">${v}°</text><path d="M${left} ${y(v)}H${width - right}" stroke="#24343b"/>`);
    let pilot = ''; let note = '';
    const rows = pilotRows();
    if (state.joint === 'knee' && rows.length) {
      // RIC stores the negated stance peak for knee flexion; its magnitude is comparable with this flexion-positive curve.
      const magnitudes = rows.map((row) => Math.abs(Number(row.median)));
      const peakIndex = curve.mean.slice(0, Math.round(toe)).reduce((best, value, i, list) => value > list[best] ? i : best, 0);
      pilot = magnitudes.map((m, i) => `<path d="M${x(Math.max(0, peakIndex - 9))} ${y(m)}H${x(peakIndex + 9)}" stroke="#f0b98f" stroke-width="2.5" stroke-dasharray="${i ? '4 3' : ''}"/>`).join('') + `<text x="${x(peakIndex + 11)}" y="${y(Math.max(...magnitudes)) - 4}" class="curve-pilot">${text('Piloto RIC', 'RIC pilot')}</text>`;
      const sd = curve.sd[peakIndex];
      note = text(`Pico de apoyo de la referencia: ${fmt(curve.mean[peakIndex])}° ± ${fmt(sd)}°. Medianas del piloto RIC: ${magnitudes.map((m) => fmt(m)).join('° izq. / ')}° der. Quedan dentro de una desviación estándar.`, `Reference stance peak: ${fmt(curve.mean[peakIndex])}° ± ${fmt(sd)}°. RIC pilot medians: ${magnitudes.map((m) => fmt(m)).join('° left / ')}° right. Both fall within one standard deviation.`);
    } else if (state.joint === 'ankle') {
      note = text('Curva de los archivos oficiales de Figshare. Sus picos de tobillo quedan unos 3,4° por debajo de la Tabla 4 del artículo de PeerJ (cadera y rodilla coinciden), por eso no se compara con el piloto RIC.', 'Curve from the official Figshare files. Their ankle peaks sit about 3.4° below Table 4 of the PeerJ article (hip and knee match), so it is not compared with the RIC pilot.');
    } else if (state.joint === 'hip') {
      note = text('El valor de cadera de RIC es el máximo del eje 3 con el signo invertido. Esa convención no coincide con esta curva, por eso no se superpone.', 'The RIC hip value is the negated axis-3 maximum. That convention does not match this curve, so it is not overlaid.');
    }
    box.innerHTML = `<svg viewBox="0 0 ${width} ${height}" class="curve-plot" role="img" aria-label="${text('Curva media publicada del ángulo articular durante el ciclo de carrera, con su desviación estándar', 'Published mean joint-angle curve over the running cycle, with its standard deviation')}"><rect x="${x(0)}" y="${top}" width="${x(toe) - x(0)}" height="${height - top - bottom}" fill="#f0b98f10"/>${ticks.join('')}<path d="${band}" fill="#bdea8522"/><path d="${line}" stroke="#bdea85" stroke-width="2.5" fill="none"/>${pilot}<path id="curve-marker" d="M${x(0)} ${top}V${height - bottom}" stroke="#f0f2ec" stroke-width="1.5"/><text x="${x(toe / 2)}" y="${height - 8}" text-anchor="middle" class="curve-axis">${text('APOYO', 'STANCE')}</text><text x="${x((toe + 100) / 2)}" y="${height - 8}" text-anchor="middle" class="curve-axis">${text('OSCILACIÓN Y VUELO', 'SWING AND FLIGHT')}</text></svg><p class="curve-note">${note}</p>`;
    state.curveX = x; state.curveTop = top; state.curveBottom = height - bottom;
  }

  function draw() {
    if (!state.gait) return;
    const legs = { near: leg(state.phase), far: leg(state.phase + .5) };
    for (const [id, pose] of Object.entries(legs)) {
      select(`#${id}-thigh`).setAttribute('transform', `translate(220 205) rotate(${pose.thigh.toFixed(2)})`);
      select(`#${id}-shin`).setAttribute('transform', `translate(0 76) rotate(${pose.shin.toFixed(2)})`);
      select(`#${id}-foot`).setAttribute('transform', `translate(0 76) rotate(${pose.foot.toFixed(2)})`);
      select(`#${id}-arm`).setAttribute('transform', `translate(211 137) rotate(${(-pose.thigh * .8).toFixed(2)})`);
    }
    const offset = sample(state.offsets, state.phase);
    select('#runner-body')?.setAttribute('transform', `translate(0 ${offset.toFixed(1)})`);
    const near = legs.near; let value; let path;
    if (state.joint === 'hip') { value = near.hip; path = arc(220, 205, 34, -PELVIS_TILT, near.thigh); }
    else if (state.joint === 'knee') { value = near.knee; path = arc(near.kneePoint[0], near.kneePoint[1], 30, near.thigh, near.thigh + near.shin); }
    else { value = near.ankle; path = arc(near.anklePoint[0], near.anklePoint[1], 22, near.thigh + near.shin - 90, near.thigh + near.shin + near.foot - 76); }
    select('#angle-arc')?.setAttribute('d', path);
    const label = { hip: text('CADERA', 'HIP'), knee: text('RODILLA', 'KNEE'), ankle: text('TOBILLO', 'ANKLE') }[state.joint];
    select('#angle-readout').textContent = `${label} ${value >= 0 ? '' : '−'}${Math.round(Math.abs(value))}°`;
    select('#angle-sub').textContent = state.joint === 'ankle' ? text('+ FLEXIÓN DORSAL / − PLANTAR', '+ DORSIFLEXION / − PLANTAR') : text('+ FLEXIÓN / − EXTENSIÓN', '+ FLEXION / − EXTENSION');
    const nearStance = inStance(state.phase); const farStance = inStance(state.phase + .5);
    const chip = select('#phase-chip');
    chip.textContent = nearStance ? text('APOYO: PIE CERCANO', 'STANCE: NEAR FOOT') : farStance ? text('APOYO: PIE LEJANO', 'STANCE: FAR FOOT') : text('FASE DE VUELO', 'FLIGHT PHASE');
    chip.setAttribute('fill', nearStance || farStance ? '#f0b98f' : '#9fc7f1');
    if (state.curveX) select('#curve-marker')?.setAttribute('d', `M${state.curveX(state.phase * 100).toFixed(1)} ${state.curveTop}V${state.curveBottom}`);
    select('#gait-phase').value = String(Math.round(state.phase * 100));
    select('#phase-value').textContent = `${Math.round(state.phase * 100)}%`;
  }
  function render() {
    select('#runner-play').textContent = state.paused ? text('Reproducir ciclo', 'Play cycle') : text('Pausar ciclo', 'Pause cycle');
    select('#runner-play').setAttribute('aria-pressed', String(!state.paused));
    select('#gait-phase').setAttribute('aria-label', text('Posición en el ciclo de carrera', 'Position in the running cycle'));
    for (const button of document.querySelectorAll('[data-joint]')) {
      button.classList.toggle('active', button.dataset.joint === state.joint);
      button.setAttribute('aria-pressed', String(button.dataset.joint === state.joint));
    }
    svg.dataset.selectedJoint = state.joint;
    select('#movement-variable').textContent = PILOT[state.joint];
    const rows = pilotRows();
    if (rows.length) {
      select('#movement-values').textContent = rows.map((row) => `${row.side === 'left' ? text('Izq.', 'Left') : text('Der.', 'Right')} ${fmt(row.median, 2)}°`).join(' · ');
      select('#movement-explanation').textContent = state.joint === 'knee'
        ? text(`Medianas de ${rows[0].n} personas. RIC guarda el pico de flexión con signo negativo: −41,65° significa unos 42° de rodilla doblada en el apoyo.`, `Medians of ${rows[0].n} people. RIC stores peak flexion with a negative sign: −41.65° means about 42° of knee bend in stance.`)
        : state.joint === 'ankle'
          ? text(`Medianas de ${rows[0].n} personas. Valor positivo: flexión dorsal máxima en el apoyo (la tibia avanza sobre el pie). No se superpone a la curva de referencia.`, `Medians of ${rows[0].n} people. Positive value: peak dorsiflexion in stance (the shin moves over the foot). Not overlaid on the reference curve.`)
          : text(`Medianas de ${rows[0].n} personas, con el signo de la fuente. Su definición no permite leerlo como grados de extensión sin revisar la convención.`, `Medians of ${rows[0].n} people, source sign preserved. Its definition cannot be read as degrees of extension without checking the convention.`);
    }
    renderCurve();
    draw();
  }
  select('#runner-play').addEventListener('click', () => {
    if (state.paused && document.body.classList.contains('motion-paused')) select('#motion')?.click();
    state.paused = !state.paused; render();
  });
  select('#gait-phase').addEventListener('input', (event) => { state.paused = true; state.phase = Number(event.target.value) / 100; render(); });
  for (const button of document.querySelectorAll('[data-joint]')) button.addEventListener('click', () => { state.joint = button.dataset.joint; render(); });
  reduced.addEventListener('change', (event) => { if (event.matches) { state.paused = true; render(); } });
  new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; }, { threshold: .05 }).observe(svg);
  let previous;
  function animate(now) {
    const elapsed = previous === undefined ? 0 : Math.min(50, now - previous);
    previous = now;
    // One cycle (two steps) lasts 60 / 81.6 s, the RIC pilot median stride rate, slowed 2x for reading.
    if (state.gait && state.visible && !state.paused && !document.hidden && !document.body.classList.contains('motion-paused')) { state.phase = (state.phase + elapsed / 1470) % 1; draw(); }
    requestAnimationFrame(animate);
  }
  gaitReference.then((gait) => { state.gait = gait; state.offsets = buildOffsets(); render(); }).catch(() => { select('#movement-curve') && (select('#movement-curve').textContent = text('No se pudo cargar la curva de referencia.', 'The reference curve could not be loaded.')); });
  requestAnimationFrame(animate);
  return { update(atlas, language) { state.atlas = atlas; state.language = language; render(); } };
}
