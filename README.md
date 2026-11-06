# Sports Rehab Intelligence

**Three studies. One connected perspective.**  
Sports Rehabilitation & Human Performance · Víctor Andrés Gómez López · Research release 1.0.0

[Interactive ES/EN atlas](https://sports-rehab-intelligence.vercel.app) · [Evidence](https://sports-rehab-intelligence.vercel.app/evidence.html) · [Kaggle dataset](https://www.kaggle.com/datasets/vctorandrsgmezlpez/sports-rehab-intelligence-evidence-atlas) · [Kaggle audit notebook](https://www.kaggle.com/code/vctorandrsgmezlpez/sports-rehab-three-study-evidence-audit) · [Portfolio](https://victor-gomez-portfolio.vercel.app/projects/sports-rehab-intelligence)

![Three complementary studies: movement, training and injury consequences](web/cover.svg)

## The research direction

**Which movement, training and injury-consequence dimensions are observed, and which measurements and validations are needed to connect them?**

This project brings three independent studies together as a reproducible **evidence and data-compatibility atlas**. It integrates source-aware definitions, outcomes, measurement coverage and aggregate findings. People, sports, time bases and endpoints retain their context. No athlete linkage, pooled injury count, combined clinical score or multimodal effect estimate is produced.

| Study | Contribution | Reviewed evidence and limits |
| --- | --- | --- |
| [Running Injury Clinic](https://sports-rehab-intelligence.vercel.app/studies/running-injury-clinic/) · [code](https://github.com/victorgomezadapty/running-injury-clinic) | Movement and current-status metadata | 1,402 people with running metadata; 30-person pilot, 13 variables per side; local official event/cycle validation pending |
| [Competitive Runners](https://sports-rehab-intelligence.vercel.app/studies/competitive-runners-injury-risk/) · [code](https://github.com/victorgomezadapty/competitive-runners-injury-risk) | Training histories and selected injury labels | 74 athletes, 42,766 Day events, 583 retained labels; saved temporal/athlete validation; future-conditioned controls |
| [European Football Injuries](https://sports-rehab-intelligence.vercel.app/studies/european-football-injuries/) · [code](https://github.com/victorgomezadapty/european-football-injuries) | Recorded absence and consequences | 15,603 records; duration, match loss and repeated-interval sensitivity; no complete eligible-exposure denominator or verified clinical return |

The framework **movement → training → injury → consequences** describes research questions, not an observed causal chain across these cohorts.

## What is implemented

- A common catalogue of **104 source-prefixed definitions**, preserving original metadata, units, timing and limitations. These are not 104 simultaneously measured predictors.
- A registry of **three distinct outcomes**, and an authored compatibility map of **nine domains × three sources**.
- Contextual views of RIC pilot medians/quartiles, primary held-out runners metrics and football burden/sensitivity. Numerical results remain attributed to the source analyses.
- Eleven aggregate/definition inputs frozen to source Git commits, SHA-256 provenance, a self-contained Kaggle package and an independently executable offline audit notebook.
- A responsive bilingual static website, conceptual SVGs, searchable catalogue, matching chart tables, reduced-motion support and a motion pause control.
- Three study routes inside this same site. Each route mounts that study's own interactive frontend at a pinned commit. The routes do not merge rows, people or clinical scores.
- Prominent source-specific conclusions, a joint interpretation of what the integration produced, and an interactive educational runner separating illustrative poses from real pilot medians. See the [Spanish synthesis](docs/synthesis_es.md).
- A bilingual focused discussion and a specification for a future genuinely linked cohort.

## Reproduce offline

Python 3.11+ uses the standard library only. Node 20+ builds the website without npm dependencies. The atlas release does not need raw participant data or accounts. Building the website fetches three pinned frontend directories. A local checkout can replace that fetch. See below.

```powershell
python scripts/build_release.py
python -m unittest discover -s tests -v
npm test
npm run build
npm run dev
```

Open the local URL printed by the dev server. The notebook at `notebooks/01_evidence_atlas_audit.ipynb` runs beside the release files or with the Kaggle dataset attached. The test suite executes its code cells in a fresh namespace without requiring a Jupyter installation.

## Files

```text
config/                   Construct map and primary references
data/source-snapshots/    Aggregate/definition inputs only
data/source_manifest.json  Repository, exact commit, paths and checksums
reports/                  Source summary and lossless definition catalogue
delivery/kaggle/          Rebuilt dataset release
delivery/kaggle-notebook/ Notebook and platform metadata
notebooks/                Standalone release and source audit
docs/                     Methods, discussion, search record and research plan
web/                      Bilingual atlas, shared route bar and licensed downloads
studies/sources.json      Pinned commits for the three interactive frontends
scripts/                  Offline compilation, notebook, static build and route mount
tests/                    Evidence, provenance, endpoint and web contracts
```

## Integrated study routes

The atlas remains the home page. Each study keeps the interactive experience that belongs to it:

| Route | Experience kept on the route | Frontend read from |
| --- | --- | --- |
| `/studies/running-injury-clinic/` | 30-person pilot, running animation, covariate balance, label stability | `running-injury-clinic` directory `site/` |
| `/studies/competitive-runners-injury-risk/` | Five athlete histories, held-out validation, pre-event contrast, non-clinical AUC 0.546 | `competitive-runners-injury-risk` directory `web/` |
| `/studies/european-football-injuries/` | 15,603 absence records, injury and non-injury scope, season and league filters, region view | `european-football-injuries` directory `web/` |

`studies/sources.json` pins the repository, the full commit and the directory. `npm run build` copies only that directory into `dist/studies/<route>/`, rewrites root-absolute asset links, and adds the shared Sports Rehab bar. Those copied files are build output. They are not committed. Each route loads only its own JSON. The atlas catalogue stays a separate file.

### Updating an embedded study

The scientific repository stays the place where the analysis, notebooks and its own site are edited. This hub does not need a separate Vercel project for each study.

1. Merge the frontend change in the scientific repository.
2. Set that commit in `studies/sources.json`.
3. Run `npm test` and `npm run build` here. The existing Sports Rehab Intelligence deployment builds `dist/` when you later choose to publish this repository. Do not create a new Vercel project for the hub.
4. Optional local checkouts: set `SRI_STUDY_ROOT` to a parent folder that contains the three repository directories. `HEAD` in each checkout must match the pin. A single checkout can use `SRI_STUDY_DIR_<id>`, for example `SRI_STUDY_DIR_running-injury-clinic`.

The first build needs either network access to GitHub or those local checkouts. Later builds reuse `.study-cache/` when the pin has not changed. Original domains, portfolio pages and Kaggle packages are left as they are.

## Qué reúne este proyecto

Sports Rehab Intelligence es el proyecto integrador de tres estudios sobre **movimiento, entrenamiento y consecuencias de la lesión**. Su primera entrega compara qué está medido, qué es provisional y qué datos faltan. El catálogo conserva la fuente de cada definición y los resultados mantienen sus denominadores.

La página de inicio sigue siendo el atlas. Cada estudio conserva su experiencia interactiva en una ruta propia: biomecánica, carga y ausencias. Esas rutas leen el frontend fijado en `studies/sources.json` y no mezclan filas ni calculan una inferencia clínica conjunta. Para actualizar una experiencia, cambia el repositorio científico y luego el commit fijado. No hace falta un proyecto de Vercel por estudio.

La siguiente etapa empírica necesita las mismas personas con identidad estable, biomecánica validada, historia temporal, episodios clínicos y exposición elegible. Una fuente no completa retrospectivamente las mediciones ausentes de otra cohorte. Lee la [discusión en español](docs/discussion_es.md), los [métodos](docs/methodology.md) y la [línea de investigación](docs/research_direction.md).

## Attribution and rights

Original measurements: **Ferber, Brett, Fukuchi, Hettinga and Osis**, RIC Figshare v1, [DOI](https://doi.org/10.25452/figshare.plus.24255795.v1), CC BY 4.0; **Sofie Lövdal, Ruud J. R. den Hartigh and George Azzopardi**, Dataverse v2.0, [DOI](https://doi.org/10.34894/UWU9PV), CC0; **Sanan Muzaffarov**, European Football Injuries Kaggle v2, [source](https://www.kaggle.com/datasets/sananmuzaffarov/european-football-injuries-2020-2025/versions/2), CC BY-SA 4.0. Cite creators separately from this independent analysis.

Original software: [MIT](LICENSE). Atlas compilation and derivatives: **CC BY-SA 4.0**, with separately identifiable source rights preserved. See [attribution, transformations and licences](DATA_LICENSE.md). No raw trajectories, individual training histories, named medical histories, full articles or third-party figures are redistributed. The narrative discussion is not a systematic review.
