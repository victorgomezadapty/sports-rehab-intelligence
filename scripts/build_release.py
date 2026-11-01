"""Rebuild the self-contained evidence atlas, web data and Kaggle release offline."""

import csv
import hashlib
import io
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / "delivery/kaggle"
WEB = ROOT / "web"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")


def table(path, rows, fields):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path):
    return list(csv.DictReader(io.StringIO(path.read_text(encoding="utf-8-sig"))))


def main():
    manifest = load(ROOT / "data/source_manifest.json")
    for item in manifest["files"]:
        if hashlib.sha256((ROOT / item["path"]).read_bytes()).hexdigest() != item["sha256"]:
            raise ValueError(f"Source snapshot changed: {item['path']}")
    subprocess.run([sys.executable, str(ROOT / "scripts/build_evidence_snapshot.py")], check=True)
    snapshot = load(ROOT / "reports/integration_snapshot.json")
    original_catalog = load(ROOT / "reports/feature_catalog.json")
    matrix = load(ROOT / "config/domain_matrix.json")
    references = load(ROOT / "config/references.json")
    catalog = []
    for item in original_catalog:
        definition = item["original_definition"]
        catalog.append({
            "catalog_key": item["catalog_key"], "source_id": item["source_id"],
            "original_variable": definition.get("feature", definition.get("feature_name")),
            "source_domain_or_role": definition.get("domain", definition.get("role", "")),
            "definition": definition["definition"],
            "units": definition.get("unit", definition.get("units", "")),
            "observation_context": definition.get("grain", definition.get("window", definition.get("phase", ""))),
            "timing_or_verification": definition.get("verification_scope", definition.get("timing_status", definition.get("prediction_time_available", ""))),
            "limitations": definition.get("limitation", definition.get("limitations", definition.get("verification_scope", ""))),
            "source_file": item["source_file"],
            "original_definition_json": json.dumps(definition, ensure_ascii=False, sort_keys=True),
        })
    metrics = [
        {"source_id": source["source_id"], "metric": metric, "value": value, "observation_unit": source["observation_unit"], "limitation": source["limitation"]}
        for source in snapshot["sources"] for metric, value in source["metrics"].items()
    ]
    outcomes = [
        {key: source[key] for key in ("source_id", "project", "observation_unit", "outcome", "time_basis", "limitation", "licence")}
        for source in snapshot["sources"]
    ]
    domain_rows = [
        {"domain_id": domain["domain_id"], "domain": domain["en"], "source_id": source["source_id"], "status": domain[source["source_id"]], "interpretation": domain["note_en"]}
        for domain in matrix["domains"] for source in snapshot["sources"]
    ]
    for row in domain_rows:
        if row["status"] not in matrix["statuses"]:
            raise ValueError(f"Unrecognised mapping status: {row}")
    ric_dir = ROOT / "data/source-snapshots/Running_Injury_Clinic"
    runners_dir = ROOT / "data/source-snapshots/Competitive_Runners/competitive-runners-injury-risk"
    football_dir = ROOT / "data/source-snapshots/European_Football_Injuries"
    charts = {
        "ric_pilot_descriptives": read_csv(ric_dir / "reports/tables/pilot_descriptive_summary.csv"),
        "runners_primary_validation": read_csv(runners_dir / "reports/phase_02/tables/primary_summary.csv"),
        "football_duplicate_sensitivity": read_csv(football_dir / "reports/tables/duplicate_sensitivity.csv"),
        "football_burden": read_csv(football_dir / "web/downloads/injury_burden.csv"),
    }
    links = {
        "site": "https://sports-rehab-intelligence.vercel.app",
        "github": "https://github.com/victorgomezadapty/sports-rehab-intelligence",
        "kaggle": "https://www.kaggle.com/datasets/vctorandrsgmezlpez/sports-rehab-intelligence-evidence-atlas",
        "notebook": "https://www.kaggle.com/code/vctorandrsgmezlpez/sports-rehab-three-study-evidence-audit",
        "portfolio": "https://victor-gomez-portfolio.vercel.app/projects/sports-rehab-intelligence",
    }
    atlas = {
        "release": "1.0.0", "snapshot_date": manifest["snapshot_date"],
        "integration_level": snapshot["integration_level"], "sources": snapshot["sources"],
        "catalog": catalog, "matrix": matrix, "charts": charts, "references": references,
        "links": links, "pooled_population_count": None, "pooled_injury_count": None,
        "cross_source_effect_estimate": None,
        "source_manifest": manifest,
    }
    RELEASE.mkdir(parents=True, exist_ok=True)
    table(RELEASE / "feature_catalog.csv", catalog, list(catalog[0]))
    table(RELEASE / "source_metrics.csv", metrics, list(metrics[0]))
    table(RELEASE / "outcome_registry.csv", outcomes, list(outcomes[0]))
    table(RELEASE / "domain_matrix.csv", domain_rows, list(domain_rows[0]))
    for key, rows in charts.items():
        table(RELEASE / f"{key}.csv", rows, list(rows[0]))
    dictionary = []
    for filename in ("feature_catalog.csv", "source_metrics.csv", "outcome_registry.csv", "domain_matrix.csv", *[f"{key}.csv" for key in charts]):
        rows = read_csv(RELEASE / filename)
        for column in rows[0]:
            dictionary.append({"file": filename, "column": column, "definition": {
                "source_id": "Namespace of the independent source cohort; not an athlete identifier",
                "catalog_key": "Source-prefixed variable-definition key; not a combined predictor",
                "original_definition_json": "Lossless original catalogue metadata for audit",
                "value": "Source-specific aggregate value; metric and observation_unit govern interpretation",
                "status": "Authored mapping: available, provisional, different_construct or not_available",
                "units": "Original source units; no cross-source conversion applied",
            }.get(column, f"Source-specific {column.replace('_', ' ')}; see original_definition_json and outcome registry")})
    table(RELEASE / "data_dictionary.csv", dictionary, list(dictionary[0]))
    dump(RELEASE / "atlas_summary.json", atlas)
    dump(RELEASE / "source_manifest.json", manifest)
    dump(RELEASE / "references.json", references)
    for name in ("DATA_LICENSE.md", "docs/methodology.md", "docs/discussion_es.md", "docs/discussion.md", "docs/literature_search.md", "docs/research_direction.md"):
        shutil.copyfile(ROOT / name, RELEASE / Path(name).name)
    description = (ROOT / "docs/kaggle_description.md").read_text(encoding="utf-8")
    (RELEASE / "README.md").write_text(description, encoding="utf-8", newline="\n")
    dump(RELEASE / "dataset-metadata.json", {
        "id": "vctorandrsgmezlpez/sports-rehab-intelligence-evidence-atlas",
        "title": "Sports Rehab Intelligence Evidence Atlas",
        "subtitle": "Three independent studies: source-aware variables, outcomes and compatibility",
        "licenses": [{"name": "CC-BY-SA-4.0"}], "description": description,
    })
    with zipfile.ZipFile(RELEASE / "source_snapshots.zip", "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for item in manifest["files"]:
            info = zipfile.ZipInfo(item["path"], date_time=(2026, 11, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, (ROOT / item["path"]).read_bytes())
    subprocess.run([sys.executable, str(ROOT / "scripts/build_notebook.py")], check=True)
    shutil.copyfile(ROOT / "notebooks/01_evidence_atlas_audit.ipynb", RELEASE / "evidence_atlas_audit.ipynb")
    # Manifest excludes itself and platform metadata, which the platform may rewrite.
    release_hashes = {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                      for path in sorted(RELEASE.iterdir()) if path.is_file() and path.name not in {"release_manifest.json", "dataset-metadata.json"}}
    dump(RELEASE / "release_manifest.json", {"schema_version": 1, "files": release_hashes})
    dump(WEB / "data/atlas.json", atlas)
    downloads = WEB / "downloads"
    downloads.mkdir(parents=True, exist_ok=True)
    for path in RELEASE.iterdir():
        if path.is_file() and path.name not in {"dataset-metadata.json"}:
            shutil.copyfile(path, downloads / path.name)
    print(f"Built atlas: {len(catalog)} definitions, {len(domain_rows)} domain/source cells, {len(outcomes)} distinct outcome definitions.")


if __name__ == "__main__":
    main()
