# Sports Rehab Intelligence — Three-Study Evidence Atlas

An independent, reproducible integration of **movement, training history and recorded injury consequences**. Analysis and original software: Víctor Andrés Gómez López, 2026.

This dataset joins **source-aware definitions and aggregate evidence**, not individual athletes. It contains **104 variable definitions** (13 RIC, 49 competitive runners, 42 football), three distinct outcome definitions and a nine-domain compatibility matrix. The catalogue includes lineage and retrospective fields; it is not a 104-predictor modelling table.

## Included

- `feature_catalog.csv`: source-prefixed definitions, original units, timing, limitations and lossless original metadata.
- `source_metrics.csv`, `outcome_registry.csv`, `domain_matrix.csv`: source-specific aggregates, endpoints and construct mapping.
- Four source-specific chart tables: selected RIC pilot descriptives, saved primary runner validation, football burden and repeated-interval sensitivity.
- `source_snapshots.zip` and `source_manifest.json`: eleven aggregate/definition inputs pinned to original project commits and SHA-256.
- `atlas_summary.json`, a full column dictionary, release checksums, bilingual discussion, methodology and focused literature-verification record.
- `evidence_atlas_audit.ipynb`: offline executable audit that independently checks source bytes, definitions, mappings and saved results.

## Sources and credit

1. Ferber, Brett, Fukuchi, Hettinga and Osis, **Running Injury Clinic Kinematic Dataset v1**, https://doi.org/10.25452/figshare.plus.24255795.v1, CC BY 4.0. Descriptor: https://doi.org/10.1038/s41597-024-04011-7. Local study: https://running-injury-clinic.vercel.app . Pilot: 30 selected people, upstream bilateral scalars; event/cycle validation remains pending in the reviewed snapshot.
2. Sofie Lövdal, Ruud J. R. den Hartigh and George Azzopardi, **Replication Data**, Dataverse v2.0, https://doi.org/10.34894/UWU9PV, CC0. Local study: https://competitive-runners-injury-risk.vercel.app . Day: 74 athletes, 42,766 selected events and 583 retained labels; controls are conditioned on future fitness.
3. Sanan Muzaffarov, **European Football Injuries**, Kaggle v2, https://www.kaggle.com/datasets/sananmuzaffarov/european-football-injuries-2020-2025/versions/2, CC BY-SA 4.0. Local study: https://european-football-injuries.vercel.app . 15,603 absence records, with a 14,611-record candidate-collapsing sensitivity; neither count is a clinically adjudicated episode count.

Creators are credited separately from this analysis. They do not endorse it. Compilation and derivative atlas tables: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Original source rights remain as stated; original project code is MIT. Changes: source-prefixed metadata, outcome registry, authored compatibility mapping, aggregate compilation and contextual visualisation. No original raw trajectories, individual training histories, named medical histories, full articles or third-party figures are included.

## Read correctly

Different people, time bases, sports and endpoints remain separate. There is no verified cross-source participant linkage, pooled athlete/injury count, combined clinical score, incidence estimate or validated return-to-sport forecast. A recorded end is not verified clinical recovery; summed episode-days and match losses can repeat. Narrative literature discussion is not a systematic review. See `DATA_LICENSE.md` and `methodology.md`.

## Explore and reproduce

- Atlas: https://sports-rehab-intelligence.vercel.app
- GitHub: https://github.com/victorgomezadapty/sports-rehab-intelligence
- Notebook: https://www.kaggle.com/code/vctorandrsgmezlpez/sports-rehab-three-study-evidence-audit
- Portfolio and linked component studies: https://victor-gomez-portfolio.vercel.app/projects/sports-rehab-intelligence

From a repository checkout: `python scripts/build_release.py`, then `python -m unittest discover -s tests -v`. Python 3.11+ and standard library suffice for the data release. `npm test` and `npm run build` validate/build the static site with Node 20+, with no npm dependencies. The notebook runs offline with this dataset attached.
