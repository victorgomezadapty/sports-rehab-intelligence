# Inventario integrado de Sports Rehab

Generado desde salidas locales agregadas. No vuelve a ejecutar los estudios originales.

Las cifras conservan la fuente y la unidad; no se suman entre cohortes.

## Running Injury Clinic

Unidad: Running metadata record; selected trial in technical pilot

| Métrica | Valor |
| --- | ---: |
| running_metadata_participants | 1,402 |
| running_metadata_records | 1,832 |
| pilot_participants | 30 |
| pilot_features_per_side | 13 |
| pilot_finite_source_values | 780 |
| independently_validated_events_trials | 0 |

Definiciones en el catálogo: 13 (no implica disponibilidad o equivalencia de mediciones).

Límite: Pilot source scalars; event/cycle validation pending in the reviewed snapshot

## Competitive Runners

Unidad: Selected event preceded by training history; Day primary

| Métrica | Valor |
| --- | ---: |
| day_athletes | 74 |
| day_selected_events | 42,766 |
| day_positive_labels | 583 |
| matched_day_week_events | 42,680 |

Definiciones en el catálogo: 49 (no implica disponibilidad o equivalencia de mediciones).

Límite: Selected sample; future-fitness control selection; label fraction is not incidence

## European Football Injuries

Unidad: Recorded absence event; candidate collapsing is sensitivity only

| Métrica | Valor |
| --- | ---: |
| absence_records | 15,603 |
| distinct_recorded_names_not_verified_people | 4,081 |
| candidate_collapsed_records_sensitivity | 14,611 |
| reported_episode_days_sum | 563,314.0 |
| reported_match_losses_sum | 85,928.0 |

Definiciones en el catálogo: 42 (no implica disponibilidad o equivalencia de mediciones).

Límite: Unverified identity/endpoints; repeated intervals; no eligible-exposure denominator

## Procedencia

Cada archivo de entrada se identifica con SHA-256 en `integration_snapshot.json`.

El catálogo conserva las definiciones originales bajo claves con fuente; no contiene valores individuales.

No se ha estimado un efecto conjunto ni se han vinculado deportistas entre fuentes.
