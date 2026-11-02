// Educational geometry only. Drawn poses are never reconstructed participant data.
export function createMovementExplorer() {
  const svg = document.querySelector('#runner-scene');
  if (!svg) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { paused: reduced.matches, visible: false, phase: .12, joint: 'knee', language: 'es', atlas: null };
  const joints = {
    hip: { feature: 'HIP_EXT_PEAK_ANGLE', es: 'Cadera', en: 'Hip' },
    knee: { feature: 'KNEE_FLEX_PEAK_ANGLE', es: 'Rodilla', en: 'Knee' },
    ankle: { feature: 'ANKLE_DF_PEAK_ANGLE', es: 'Tobillo', en: 'Ankle' },
  };
  const select = (selector) => document.querySelector(selector);
  const text = (es, en) => state.language === 'es' ? es : en;
  const rad = (degrees) => degrees * Math.PI / 180;
  // Point (x, y) rotated by an SVG angle (clockwise, degrees).
  const turn = (x, y, degrees) => [x * Math.cos(rad(degrees)) - y * Math.sin(rad(degrees)), x * Math.sin(rad(degrees)) + y * Math.cos(rad(degrees))];
  function leg(angle) {
    const thigh = 29 * Math.sin(angle);
    // Positive rotation swings the shin backward (heel toward the buttock): real knee flexion.
    const knee = 13 + 65 * Math.max(0, Math.sin(angle - .35));
    const foot = 8 + 8 * Math.cos(angle);
    const [kx, ky] = turn(0, 76, thigh); const kneePoint = [220 + kx, 205 + ky];
    const [ax, ay] = turn(0, 76, thigh + knee); const anklePoint = [kneePoint[0] + ax, kneePoint[1] + ay];
    const [tx, ty] = turn(32, 8, thigh + knee + foot); const toe = [anklePoint[0] + tx, anklePoint[1] + ty];
    return { thigh, knee, foot, kneePoint, anklePoint, lowest: Math.max(anklePoint[1] + 6, toe[1] + 6) };
  }
  function arc(cx, cy, radius, from, to) {
    // Angles measured clockwise from "down" (0 deg), matching the limb transforms.
    const point = (degrees) => { const [x, y] = turn(0, radius, degrees); return [cx + x, cy + y]; };
    const [x1, y1] = point(from); const [x2, y2] = point(to);
    const sweep = to > from ? 1 : 0; const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${radius} ${radius} 0 ${large} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
  }
  function draw() {
    const theta = state.phase * 2 * Math.PI;
    const legs = { near: leg(theta), far: leg(theta + Math.PI) };
    for (const [id, pose] of Object.entries(legs)) {
      select(`#${id}-thigh`).setAttribute('transform', `translate(220 205) rotate(${pose.thigh})`);
      select(`#${id}-shin`).setAttribute('transform', `translate(0 76) rotate(${pose.knee})`);
      select(`#${id}-foot`).setAttribute('transform', `translate(0 76) rotate(${pose.foot})`);
      select(`#${id}-arm`).setAttribute('transform', `translate(211 137) rotate(${-pose.thigh})`);
    }
    // Keep the lowest foot on the ground line so the body rises and falls with the stride.
    const lowest = Math.max(legs.near.lowest, legs.far.lowest);
    const offset = 375 - lowest;
    select('#runner-body')?.setAttribute('transform', `translate(0 ${offset.toFixed(1)})`);
    const near = legs.near;
    const stance = near.lowest >= legs.far.lowest;
    let value; let path;
    if (state.joint === 'hip') { value = near.thigh; path = arc(220, 205, 34, 0, near.thigh); }
    else if (state.joint === 'knee') { value = near.knee; path = arc(near.kneePoint[0], near.kneePoint[1], 30, near.thigh, near.thigh + near.knee); }
    else { value = 104 + near.foot; path = arc(near.anklePoint[0], near.anklePoint[1], 22, near.thigh + near.knee - 180, near.thigh + near.knee + near.foot - 76); }
    select('#angle-arc')?.setAttribute('d', path);
    const label = { hip: text('CADERA', 'HIP'), knee: text('RODILLA', 'KNEE'), ankle: text('TOBILLO', 'ANKLE') }[state.joint];
    const readout = select('#angle-readout'); if (readout) readout.textContent = `${label} ${Math.round(Math.abs(value))}°`;
    const sub = select('#angle-sub'); if (sub) sub.textContent = text('ÁNGULO DE LA ANIMACIÓN', 'ANIMATION ANGLE');
    const chip = select('#phase-chip');
    if (chip) { chip.textContent = stance ? text('PIE CERCANO EN APOYO', 'NEAR FOOT IN STANCE') : text('PIE CERCANO EN VUELO', 'NEAR FOOT IN SWING'); chip.setAttribute('fill', stance ? '#f0b98f' : '#9fc7f1'); }
    select('#gait-phase').value = String(Math.round(state.phase * 100));
    select('#phase-value').textContent = `${Math.round(state.phase * 100)}%`;
  }
  function render() {
    select('#runner-play').textContent = state.paused ? text('Reproducir ciclo', 'Play cycle') : text('Pausar ciclo', 'Pause cycle');
    select('#runner-play').setAttribute('aria-pressed', String(!state.paused));
    select('#gait-phase').setAttribute('aria-label', text('Posición en el ciclo ilustrativo', 'Position in the illustrative cycle'));
    for (const button of document.querySelectorAll('[data-joint]')) {
      button.classList.toggle('active', button.dataset.joint === state.joint);
      button.setAttribute('aria-pressed', String(button.dataset.joint === state.joint));
    }
    svg.dataset.selectedJoint = state.joint;
    const selected = joints[state.joint];
    select('#movement-variable').textContent = selected.feature;
    if (state.atlas) {
      const rows = state.atlas.charts.ric_pilot_descriptives.filter((row) => row.feature === selected.feature);
      const format = (value) => Number(value).toLocaleString(state.language === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      select('#movement-values').textContent = rows.map((row) => `${row.side === 'left' ? text('Izquierdo', 'Left') : text('Derecho', 'Right')}: ${format(row.median)}°`).join(' / ');
      select('#movement-explanation').textContent = text(`Medianas de los escalares de origen en ${rows[0].n} personas; se conserva el signo original. Seleccionar ${selected.es.toLowerCase()} resalta su ubicación, sin representar estos ángulos en la animación.`, `Medians of source scalars in ${rows[0].n} people; original signs are preserved. Selecting the ${selected.en.toLowerCase()} highlights its location without depicting these angles in the animation.`);
    }
    draw();
  }
  select('#runner-play').addEventListener('click', () => {
    if (state.paused && document.body.classList.contains('motion-paused')) select('#motion')?.click();
    state.paused = !state.paused;
    render();
  });
  select('#gait-phase').addEventListener('input', (event) => { state.paused = true; state.phase = Number(event.target.value) / 100; render(); });
  for (const button of document.querySelectorAll('[data-joint]')) button.addEventListener('click', () => { state.joint = button.dataset.joint; render(); });
  reduced.addEventListener('change', (event) => { if (event.matches) { state.paused = true; render(); } });
  new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; }, { threshold: .05 }).observe(svg);
  let previous;
  function animate(now) {
    const elapsed = previous === undefined ? 0 : Math.min(50, now - previous);
    previous = now;
    if (state.visible && !state.paused && !document.hidden && !document.body.classList.contains('motion-paused')) {
      state.phase = (state.phase + elapsed / 1500) % 1;
      draw();
    }
    requestAnimationFrame(animate);
  }
  render();
  requestAnimationFrame(animate);
  return { update(atlas, language) { state.atlas = atlas; state.language = language; render(); } };
}
