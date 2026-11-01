"""Create a standalone, offline audit notebook and Kaggle kernel metadata."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    cells = []

    def cell(kind, content):
        item = {"cell_type": kind, "metadata": {}, "source": content.strip().splitlines(keepends=True)}
        if kind == "code":
            item.update(execution_count=None, outputs=[])
        cells.append(item)

    cell("markdown", """
# Sports Rehab Intelligence · Three-Study Evidence Audit
**Víctor Andrés Gómez López · release 1.0.0 · 1 November 2026**

Movement, training history and injury consequences are complementary questions. This notebook
audits their integration as **metadata and source-specific aggregate evidence**. It does not
join athletes, retrain models or infer clinical risk. All code runs offline using the Python
standard library. Attach `sports-rehab-intelligence-evidence-atlas` on Kaggle, or run beside
the downloaded release files. Original measurement creators are credited below and in DATA_LICENSE.md.
""")
    cell("code", """
import csv, hashlib, io, json, zipfile
from pathlib import Path

candidates = [Path.cwd(), Path.cwd() / 'delivery/kaggle']
if Path('/kaggle/input').exists():
    candidates += [path.parent for path in Path('/kaggle/input').rglob('atlas_summary.json')]
DATA = next((path for path in candidates if (path / 'atlas_summary.json').is_file()), None)
assert DATA is not None, 'Attach or download the evidence-atlas dataset first.'
read_json = lambda name: json.loads((DATA / name).read_text(encoding='utf-8'))
read_csv = lambda name: list(csv.DictReader(io.StringIO((DATA / name).read_text(encoding='utf-8-sig'))))
atlas = read_json('atlas_summary.json')
catalog = read_csv('feature_catalog.csv')
outcomes = read_csv('outcome_registry.csv')
domains = read_csv('domain_matrix.csv')
metrics = read_csv('source_metrics.csv')
def show(rows, fields):
    print(' | '.join(fields))
    for row in rows:
        print(' | '.join(str(row[field]) for field in fields))
print('Atlas release:', atlas['release'], '| snapshot:', atlas['snapshot_date'])
""")
    cell("markdown", """
## 1. Verify every distributed file and frozen source
Checksums identify bytes and transformations. They do not establish clinical truth.
The original source archive contains eleven aggregate or definition files, with no individual histories.
""")
    cell("code", """
release = read_json('release_manifest.json')
for name, expected in release['files'].items():
    assert hashlib.sha256((DATA / name).read_bytes()).hexdigest() == expected, name
manifest = read_json('source_manifest.json')
with zipfile.ZipFile(DATA / 'source_snapshots.zip') as archive:
    expected_paths = {row['path'] for row in manifest['files']}
    assert set(archive.namelist()) == expected_paths
    for row in manifest['files']:
        assert hashlib.sha256(archive.read(row['path'])).hexdigest() == row['sha256'], row['path']
print('Verified', len(release['files']), 'release files and', len(manifest['files']), 'frozen sources.')
""")
    cell("markdown", """
## 2. Reconcile the catalogue to the original definitions
The 13 RIC definitions each apply bilaterally in its 30-person pilot. The 49 runners and
42 football entries include their own contexts; football includes lineage and retrospective
fields. Their sum is a catalogue size, **not a combined modelling matrix**.
""")
    cell("code", """
assert len(catalog) == len({row['catalog_key'] for row in catalog}) == 104
feature_key = {'ric': 'feature', 'competitive_runners': 'feature_name', 'european_football': 'feature'}
with zipfile.ZipFile(DATA / 'source_snapshots.zip') as archive:
    for source in atlas['sources']:
        path = next(row['path'] for row in manifest['files'] if row['source_id'] == source['source_id'] and row['original_project_path'] == ('handoff/pilot_feature_catalog.csv' if source['source_id'] == 'ric' else 'handoff/feature_catalog.csv'))
        originals = list(csv.DictReader(io.StringIO(archive.read(path).decode('utf-8-sig'))))
        exported = [row for row in catalog if row['source_id'] == source['source_id']]
        assert len(originals) == len(exported) == source['catalog_definition_count']
        for original, compiled in zip(originals, exported):
            assert original == json.loads(compiled['original_definition_json'])
            assert compiled['catalog_key'] == source['source_id'] + ':' + original[feature_key[source['source_id']]]
show([{'source': s['project'], 'definitions': s['catalog_definition_count']} for s in atlas['sources']], ['source', 'definitions'])
""")
    cell("markdown", """
## 3. Compare what an outcome means
RIC records current metadata status. Runners retain session-preventing event labels.
Football records reported absence intervals and match losses. These outcomes are not interchangeable.
""")
    cell("code", """
assert len(outcomes) == 3
assert len({row['outcome'] for row in outcomes}) == 3
for key in ['pooled_population_count', 'pooled_injury_count', 'cross_source_effect_estimate']:
    assert atlas[key] is None
show(outcomes, ['project', 'observation_unit', 'outcome'])
""")
    cell("markdown", """
## 4. Audit the construct map
The 27 cells reflect an authored mapping of nine domains, not measured correlations or a quality score.
`different_construct` deliberately prevents a related label being treated as an equivalent endpoint.
""")
    cell("code", """
assert len(domains) == 27
assert len({(row['domain_id'], row['source_id']) for row in domains}) == 27
assert set(row['status'] for row in domains) <= set(atlas['matrix']['statuses'])
for domain in ['complete_exposure', 'verified_return', 'multimodal_followup']:
    assert all(row['status'] == 'not_available' for row in domains if row['domain_id'] == domain)
show(domains, ['domain', 'source_id', 'status'])
""")
    cell("markdown", """
## 5. Revisit saved source results with their denominators
AP and label fraction belong to each selected runners test, not a prospective population.
The football comparison is a record-retention sensitivity, not a correction to true episode counts.
RIC medians and quartiles are pilot descriptives, not diagnostic thresholds.
""")
    cell("code", """
runners = read_csv('runners_primary_validation.csv')
show(runners, ['Validation', 'Rows', 'Labels', 'Label fraction', 'Pooled AP', 'ROC-AUC'])
football = read_csv('football_duplicate_sensitivity.csv')
assert len(football) == 2
raw, candidate = football
record_reduction = 1 - int(candidate['record_count']) / int(raw['record_count'])
print('Football candidate record reduction:', round(100 * record_reduction, 2), '%')
print('This does not estimate sensitivity to all possible recording errors or establish clinical episodes.')
ric = read_csv('ric_pilot_descriptives.csv')
assert all(int(row['n']) == 30 for row in ric)
show([row for row in ric if row['feature'] == 'STRIDE_RATE'], ['feature', 'unit', 'side', 'n', 'median', 'q1', 'q3'])
""")
    cell("markdown", """
## Interpretation and next study
The integration reveals complementary coverage and incompatible endpoints. Individual associations
between movement, training and absence require a genuinely linked cohort with verified identity,
available-at timestamps, adjudicated episodes, follow-up, eligible exposure and return criteria.

Credit original creators separately: Ferber et al., RIC v1, [dataset](https://doi.org/10.25452/figshare.plus.24255795.v1), CC BY 4.0;
Lövdal, den Hartigh and Azzopardi, [Dataverse v2.0](https://doi.org/10.34894/UWU9PV), CC0;
Sanan Muzaffarov, [football Kaggle v2](https://www.kaggle.com/datasets/sananmuzaffarov/european-football-injuries-2020-2025/versions/2), CC BY-SA 4.0.
Compilation: CC BY-SA 4.0; original project software: MIT. See `DATA_LICENSE.md`.

[Interactive atlas](https://sports-rehab-intelligence.vercel.app) ·
[GitHub](https://github.com/victorgomezadapty/sports-rehab-intelligence) ·
[Portfolio and component studies](https://victor-gomez-portfolio.vercel.app/projects/sports-rehab-intelligence)
""")
    notebook = {"cells": cells, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}, "language_info": {"name": "python", "version": "3.11"}}, "nbformat": 4, "nbformat_minor": 4}
    path = ROOT / "notebooks/01_evidence_atlas_audit.ipynb"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    kernel = ROOT / "delivery/kaggle-notebook"
    kernel.mkdir(parents=True, exist_ok=True)
    (kernel / "evidence_atlas_audit.ipynb").write_bytes(path.read_bytes())
    (kernel / "kernel-metadata.json").write_text(json.dumps({
        "id": "vctorandrsgmezlpez/sports-rehab-three-study-evidence-audit",
        "title": "Sports Rehab Three-Study Evidence Audit", "code_file": "evidence_atlas_audit.ipynb",
        "language": "python", "kernel_type": "notebook", "is_private": False,
        "enable_gpu": False, "enable_internet": False,
        "dataset_sources": ["vctorandrsgmezlpez/sports-rehab-intelligence-evidence-atlas"],
        "competition_sources": [], "kernel_sources": [], "model_sources": [],
    }, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
