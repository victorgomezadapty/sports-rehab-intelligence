"""Build an aggregate-only inventory of the three existing Sports Rehab projects."""

import csv
import hashlib
import io
import json
import math
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT / "data" / "source-snapshots"
OUTPUT = PROJECT / "reports"


def main():
    provenance = {}

    def read(relative, kind="json"):
        path = WORKSPACE / relative
        content = path.read_bytes()
        provenance[relative] = {
            "sha256": hashlib.sha256(content).hexdigest(),
            "bytes": len(content),
            "role": "aggregate summary" if kind == "json" else "variable definitions",
        }
        if kind == "json":
            return json.loads(content.decode("utf-8-sig"))
        return list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))))

    ric_root = "Running_Injury_Clinic"
    runners_root = "Competitive_Runners/competitive-runners-injury-risk"
    football_root = "European_Football_Injuries"
    ric_counts_path = f"{ric_root}/reports/tables/cohort_counts.json"
    ric_pilot_path = f"{ric_root}/reports/tables/pilot_summary.json"
    runners_path = f"{runners_root}/reports/tables/audit_summary.json"
    football_path = f"{football_root}/reports/dataset_summary.json"
    ric = read(ric_counts_path)
    pilot = read(ric_pilot_path)
    runners = read(runners_path)
    football = read(football_path)

    def count(data, key):
        value = data[key]
        if type(value) is not int or value < 0:
            raise ValueError(f"Expected a nonnegative integer: {key}={value!r}")
        return value

    def require(condition, message):
        if not condition:
            raise ValueError(message)

    sources = [
        {
            "source_id": "ric",
            "project": "Running Injury Clinic",
            "project_readme": f"{ric_root}/README.md",
            "summary_files": [ric_counts_path, ric_pilot_path],
            "observation_unit": "Running metadata record; selected trial in technical pilot",
            "outcome": "Current recorded injury status, not future injury",
            "time_basis": "Recorded timestamps; not a verified clinical follow-up schedule",
            "domains": ["running biomechanics", "current injury metadata"],
            "licence": "Upstream dataset CC BY 4.0; preserve project attribution notices",
            "metrics": {
                "running_metadata_participants": count(ric, "running_participants"),
                "running_metadata_records": count(ric, "running_observations"),
                "pilot_participants": count(pilot, "participants"),
                "pilot_features_per_side": count(pilot, "features_per_side"),
                "pilot_finite_source_values": count(pilot, "finite_source_values"),
                "independently_validated_events_trials": count(pilot, "independently_validated_events_trials"),
            },
            "limitation": "Pilot source scalars; event/cycle validation pending in the reviewed snapshot",
            "feature_catalog": f"{ric_root}/handoff/pilot_feature_catalog.csv",
            "feature_key": "feature",
        },
        {
            "source_id": "competitive_runners",
            "project": "Competitive Runners",
            "project_readme": f"{runners_root}/README.md",
            "summary_files": [runners_path],
            "observation_unit": "Selected event preceded by training history; Day primary",
            "outcome": "Retained injury label: prevented completion of a scheduled session",
            "time_basis": "Relative days; unsuffixed Day lag E-7, .6 lag E-1",
            "domains": ["training history", "subjective response", "selected injury labels"],
            "licence": "Primary dataset and dedicated tabular exports CC0; see source rights inventory",
            "metrics": {
                "day_athletes": count(runners["day"], "athletes"),
                "day_selected_events": count(runners["day"], "rows"),
                "day_positive_labels": count(runners["day"], "injury_rows"),
                "matched_day_week_events": count(runners["cross_representation"], "matched_keys"),
            },
            "limitation": "Selected sample; future-fitness control selection; label fraction is not incidence",
            "feature_catalog": f"{runners_root}/handoff/feature_catalog.csv",
            "feature_key": "feature_name",
        },
        {
            "source_id": "european_football",
            "project": "European Football Injuries",
            "project_readme": f"{football_root}/README.md",
            "summary_files": [football_path],
            "observation_unit": "Recorded absence event; candidate collapsing is sensitivity only",
            "outcome": "Reported absence duration and missed matches; not verified clinical return",
            "time_basis": "Recorded start/end dates and source seasons",
            "domains": ["recorded absence", "reported duration", "reported match loss"],
            "licence": "Derived data CC BY-SA 4.0; preserve source attribution and transformations",
            "metrics": {
                "absence_records": count(football, "analysis_records"),
                "distinct_recorded_names_not_verified_people": count(football, "unique_recorded_player_names"),
                "candidate_collapsed_records_sensitivity": count(football, "candidate_episode_count_sensitivity"),
                "reported_episode_days_sum": football["reported_total_days_out"],
                "reported_match_losses_sum": football["reported_total_games_missed"],
            },
            "limitation": "Unverified identity/endpoints; repeated intervals; no eligible-exposure denominator",
            "feature_catalog": f"{football_root}/handoff/feature_catalog.csv",
            "feature_key": "feature",
        },
    ]

    require(pilot["participants"] <= ric["running_participants"], "Pilot exceeds metadata cohort")
    require(runners["day"]["injury_rows"] <= runners["day"]["rows"], "Labels exceed Day rows")
    require(runners["cross_representation"]["matched_keys"] <= min(runners["day"]["rows"], runners["week"]["rows"]), "Matched count exceeds source rows")
    require(football["candidate_episode_count_sensitivity"] <= football["analysis_records"], "Candidate count exceeds source records")
    for key in ("reported_total_days_out", "reported_total_games_missed"):
        value = football[key]
        require(type(value) in (int, float) and math.isfinite(value) and value >= 0, f"Invalid burden: {key}")

    catalog = []
    keys = set()
    for source in sources:
        rows = read(source["feature_catalog"], "csv")
        require(bool(rows), f"Empty catalog: {source['source_id']}")
        source["catalog_definition_count"] = len(rows)
        for row in rows:
            name = row[source["feature_key"]].strip()
            key = f"{source['source_id']}:{name}"
            require(bool(name) and key not in keys, f"Empty or repeated catalog key: {key}")
            keys.add(key)
            catalog.append({
                "catalog_key": key,
                "source_id": source["source_id"],
                "source_file": source["feature_catalog"],
                "original_definition": row,
            })

    snapshot = {
        "schema_version": "0.1.0",
        "scope": "Local aggregate inventory; existing source analyses are not rerun",
        "sources": sources,
        "cross_source_linkage": "No verified participant crosswalk identified in reviewed project documentation",
        "cross_source_effect_estimate": None,
        "pooled_population_count": None,
        "pooled_injury_count": None,
        "integration_level": "Source-specific summaries and variable definitions",
        "provenance": provenance,
    }
    lines = [
        "# Inventario integrado de Sports Rehab", "",
        "Generado desde salidas locales agregadas. No vuelve a ejecutar los estudios originales.", "",
        "Las cifras conservan la fuente y la unidad; no se suman entre cohortes.", "",
    ]
    for source in sources:
        lines.extend([f"## {source['project']}", "", f"Unidad: {source['observation_unit']}", "", "| Métrica | Valor |", "| --- | ---: |"])
        lines.extend(f"| {key} | {value:,} |" for key, value in source["metrics"].items())
        lines.extend(["", f"Definiciones en el catálogo: {source['catalog_definition_count']} (no implica disponibilidad o equivalencia de mediciones).", "", f"Límite: {source['limitation']}", ""])
    lines.extend(["## Procedencia", "", "Cada archivo de entrada se identifica con SHA-256 en `integration_snapshot.json`.", "", "El catálogo conserva las definiciones originales bajo claves con fuente; no contiene valores individuales.", "", "No se ha estimado un efecto conjunto ni se han vinculado deportistas entre fuentes.", ""])

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, data in (("integration_snapshot.json", snapshot), ("feature_catalog.json", catalog)):
        (OUTPUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
    (OUTPUT / "integration_snapshot.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"Built {len(sources)} source summaries and {len(catalog)} variable definitions from {len(provenance)} files.")


if __name__ == "__main__":
    main()
