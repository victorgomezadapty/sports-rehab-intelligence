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
  function draw() {
    const theta = state.phase * 2 * Math.PI;
    for (const [id, angle] of [['near', theta], ['far', theta + Math.PI]]) {
      const thigh = 29 * Math.sin(angle);
      const knee = -13 - 65 * Math.max(0, Math.sin(angle - .35));
      select(`#${id}-thigh`).setAttribute('transform', `translate(220 205) rotate(${thigh})`);
      select(`#${id}-shin`).setAttribute('transform', `translate(0 76) rotate(${knee})`);
      select(`#${id}-foot`).setAttribute('transform', `translate(0 76) rotate(${8 + 8 * Math.cos(angle)})`);
      select(`#${id}-arm`).setAttribute('transform', `translate(211 137) rotate(${-thigh})`);
    }
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
