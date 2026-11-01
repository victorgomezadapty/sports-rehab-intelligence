// Interpretations use source-specific aggregate results, never a pooled cohort.
export function summarizeAtlas(atlas) {
  const pilot = atlas.charts.ric_pilot_descriptives;
  const stride = pilot.filter((row) => row.feature === 'STRIDE_RATE');
  const runners = atlas.charts.runners_primary_validation.find((row) => row.Validation === 'Unseen athletes / future period');
  const burden = atlas.charts.football_burden;
  const mostFrequent = burden.reduce((a, b) => Number(a.injury_count) >= Number(b.injury_count) ? a : b);
  const greatestBurden = burden.reduce((a, b) => Number(a.total_days_out) >= Number(b.total_days_out) ? a : b);
  if (stride.length !== 2 || !runners) throw new Error('Missing source-specific findings for the synthesis.');
  return {
    pilotN: Number(stride[0].n),
    strideLeft: Number(stride.find((row) => row.side === 'left').median),
    strideRight: Number(stride.find((row) => row.side === 'right').median),
    averagePrecision: Number(runners['Pooled AP']),
    positiveFraction: Number(runners['Label fraction']),
    rocAuc: Number(runners['ROC-AUC']),
    testRows: Number(runners.Rows),
    testLabels: Number(runners.Labels),
    mostFrequent,
    greatestBurden,
  };
}
