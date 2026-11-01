# Data attribution and transformation notice

Original analysis and software: Víctor Andrés Gómez López, 2026. This project is an independent integration of three previous analyses, not collection of a new combined athlete cohort. Original creators do not endorse this work.

## Source rights

- **Running Injury Clinic:** Ferber, Brett, Fukuchi, Hettinga and Osis, Running Injury Clinic Kinematic Dataset v1, https://doi.org/10.25452/figshare.plus.24255795.v1, **CC BY 4.0**, https://creativecommons.org/licenses/by/4.0/. Local derivative analysis: https://github.com/victorgomezadapty/running-injury-clinic. Transformations included pilot selection, extraction of upstream bilateral discrete variables and aggregate descriptions; no independent event/cycle validation is claimed.
- **Competitive Runners:** Sofie Lövdal, Ruud J. R. den Hartigh and George Azzopardi, Replication Data, Dataverse v2.0, https://doi.org/10.34894/UWU9PV, **CC0**. Local derivative analysis: https://github.com/victorgomezadapty/competitive-runners-injury-risk. Transformations included corrected lag interpretation, selected-event aggregation and saved validation metrics. Article rights and companion sources remain separate.
- **European Football Injuries:** Sanan Muzaffarov, Kaggle v2, https://www.kaggle.com/datasets/sananmuzaffarov/european-football-injuries-2020-2025/versions/2, **CC BY-SA 4.0**, https://creativecommons.org/licenses/by-sa/4.0/. Local derivative analysis: https://github.com/victorgomezadapty/european-football-injuries. Transformations included raw-label burden aggregation and candidate repeated-interval sensitivity. Episode sums may repeat days and matches. No clinical adjudication is implied.

## This release

The atlas compilation and its unified feature catalogue, metrics, domain matrix and derivative visualizations are offered under **CC BY-SA 4.0**, preserving attribution and change notices. This licence for the compilation does not revoke the underlying CC0 status of the runners data or restrict reuse of separately identifiable RIC material under CC BY 4.0. Original software is MIT. Scientific articles retain their own rights. No full text or third-party figure is republished.

Integration transformations: source-prefixed variable identifiers; common metadata columns; explicit outcome registry; authored construct-availability matrix; source-specific summaries; contextual display of already computed aggregate results. Definitions remain source-specific; no participant linkage, imputation across cohorts or pooled injury-effect estimate has been performed.

Only aggregate outputs and variable definitions are snapshotted in `data/source-snapshots`. Git commit references and SHA-256 checksums are recorded in `data/source_manifest.json`. The release does not redistribute raw trajectories, individual training histories or named football absence histories.

Kaggle's notebook wrapper may display its platform code licence; that does not override the above data terms or the repository software licence.
