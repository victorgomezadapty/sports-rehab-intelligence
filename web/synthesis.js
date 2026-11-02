// Interpretations use source-specific aggregate results, never a pooled cohort.

// Absences that are not musculoskeletal injuries (illness, infection, quarantine, rest, fitness, dental, oncology, mental health).
// Applied to the original labels; listed explicitly so the filter can be audited.
export const NON_INJURY_PATTERN = /corona|covid|virus|\bill\b|illness|flu|influenza|fever|\bcold\b|quarantine|infection|tonsil|stomach|\brest\b|fitness|sick|bronch|pneumon|gastro|appendic|malaria|cardiac|heart|tooth|dental|personal|family|suspen|vacc|isolation|angina|kidney|cancer|appendectomy|mononucle|poisoning|intestinal|shingles|chickenpox|skin disease|allergic|depression|circulation/i;
export const isInjuryLabel = (label) => !NON_INJURY_PATTERN.test(String(label));
export const injuryBurden = (atlas) => atlas.charts.football_burden.filter((row) => isInjuryLabel(row.injury_type_raw));

// Body regions by keyword, first match wins so no record is counted twice.
export const REGIONS = [
  { id: 'knee', es: 'Rodilla', en: 'Knee', pattern: /knee|cruciate|menisc|patell|inner ligament|collateral/i },
  { id: 'ankle_foot', es: 'Tobillo y pie', en: 'Ankle and foot', pattern: /ankle|achilles|foot|metatars|toe|heel|plantar/i },
  { id: 'hip_groin', es: 'Cadera e ingle', en: 'Hip and groin', pattern: /\bhip|groin|adductor|pubi|pubal/i },
  { id: 'thigh', es: 'Muslo', en: 'Thigh', pattern: /hamstring|thigh|quadri|dead leg/i },
  { id: 'lower_leg', es: 'Pierna y gemelo', en: 'Lower leg and calf', pattern: /calf|\bshin(?!gles)|tibia|fibula|lower leg/i },
];

export function regionBurden(atlas) {
  const rows = injuryBurden(atlas);
  const totals = { records: 0, days: 0 };
  const regions = REGIONS.map((region) => ({ ...region, records: 0, days: 0, labels: 0 }));
  for (const row of rows) {
    const records = Number(row.injury_count); const days = Number(row.total_days_out);
    totals.records += records; totals.days += days;
    const region = regions.find((item) => item.pattern.test(row.injury_type_raw));
    if (region) { region.records += records; region.days += days; region.labels += 1; }
  }
  return { totals, regions: regions.map((region) => ({ ...region, recordShare: region.records / totals.records, dayShare: region.days / totals.days, meanDays: region.days / region.records })) };
}

export function summarizeAtlas(atlas) {
  const pilot = atlas.charts.ric_pilot_descriptives;
  const stride = pilot.filter((row) => row.feature === 'STRIDE_RATE');
  const runners = atlas.charts.runners_primary_validation.find((row) => row.Validation === 'Unseen athletes / future period');
  const all = atlas.charts.football_burden;
  const burden = injuryBurden(atlas);
  const mostFrequent = burden.reduce((a, b) => Number(a.injury_count) >= Number(b.injury_count) ? a : b);
  const greatestBurden = burden.reduce((a, b) => Number(a.total_days_out) >= Number(b.total_days_out) ? a : b);
  if (stride.length !== 2 || !runners) throw new Error('Missing source-specific findings for the synthesis.');
  const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key]), 0);
  return {
    pilotN: Number(stride[0].n),
    strideLeft: Number(stride.find((row) => row.side === 'left').median),
    strideRight: Number(stride.find((row) => row.side === 'right').median),
    stepsPerMinute: 2 * Number(stride.find((row) => row.side === 'left').median),
    averagePrecision: Number(runners['Pooled AP']),
    apLow: Number(runners['AP CI low']),
    apHigh: Number(runners['AP CI high']),
    positiveFraction: Number(runners['Label fraction']),
    rocAuc: Number(runners['ROC-AUC']),
    testRows: Number(runners.Rows),
    testLabels: Number(runners.Labels),
    mostFrequent,
    greatestBurden,
    burdenGap: Number(greatestBurden.total_days_out) / Number(mostFrequent.total_days_out) - 1,
    injuryRecords: sum(burden, 'injury_count'),
    allRecords: sum(all, 'injury_count'),
    excludedLabels: all.length - burden.length,
  };
}
