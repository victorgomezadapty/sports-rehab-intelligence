# Methods — release 1.0.0

## Research question

Which movement, training and injury-consequence constructs are observed in three existing analyses, and which measurement, identity and endpoint conditions are needed to connect them?

This is a source-aware evidence and data-compatibility study. It is not a meta-analysis, pooled cohort or clinical prediction model. The target of the integration is metadata and source-specific aggregate evidence, not individual athlete outcomes.

## Inputs and provenance

Eleven aggregate or variable-definition files were frozen on 1 November 2026 from three Git repositories. `data/source_manifest.json` gives each repository, exact commit, original relative path, raw URL and SHA-256. Byte-normalized comparison against the referenced Git object confirmed that the local files matched their recorded commits; both checkout and Git-object hashes are retained where newline conventions differ. The published bundle preserves the actual checkout bytes, checked against `sha256`.

The primary data versions remain RIC Figshare v1, competitive runners Dataverse v2.0 and football Kaggle v2. No new raw-data acquisition, reprocessing of the upstream trajectories, model training or individual cross-source join occurs here. Companion sources used in the original projects are outside this three-source analysis.

## Common catalogue

Each original feature-definition row receives a `source_id` and `catalog_key`. Fields expose original variable, domain or role, definition, unit, observation context, timing/verification and limitation. Original metadata are preserved losslessly in `original_definition_json`. Source-specific metadata that are not equivalent remain visibly different. The 104 entries consist of 13 RIC pilot definitions (each applied bilaterally), 49 runners feature definitions and 42 football catalogue entries, some of which describe identity, lineage or retrospective outputs. This is not a set of 104 simultaneously measured predictors.

## Outcome registry and compatibility

Each source retains its observation unit, endpoint, time basis and limitation. An authored matrix maps nine constructs against the three sources, producing 27 domain/source cells. `available` means recorded under the source definition; `provisional` flags the RIC technical pilot; `different_construct` marks a related but non-equivalent measurement; `not_available` means unavailable for this purpose. The mapping is an explicitly documented analytic judgment, not a validated measurement-invariance test or a numerical quality score.

RIC historical injury duration is not football time-loss duration; runners session-preventing labels are not diagnoses or absence intervals. Calendar dates are not recovered from relative runners days. Participant names, opaque IDs and hashes do not establish cross-source identity. Null pooled counts and null combined-effect fields are intentional.

## Reused results and original integration

RIC charts display stored bilateral summary medians and quartiles from a fixed 30-person pilot, without group tests or clinical thresholds. Runners charts display the prespecified primary validation results, keeping each test label fraction, protocol and test size. Football displays raw-label burden and the candidate-collapsing sensitivity. Candidate collapsing is not episode adjudication; summed episode-days and matches can double count. No new significance tests or cross-population effect ranking is performed.

The original integrative outputs are the common source-prefixed catalogue, distinct-outcome registry, construct mapping, reproducible combined release and the linked-cohort requirements. Reused numeric results remain attributed to the three earlier analyses and their original measurement creators.

## Validation

The build verifies hashes before loading source snapshots, checks source count types and internal bounds, preserves catalogue definitions and rejects duplicate keys or unknown matrix statuses. Independent tests reconcile the compiled rows to the frozen inputs and ensure absent cross-source endpoints do not become combined estimates. The notebook independently validates the release and source archive offline. Website checks cover the source-specific data contract, downloads and navigation; browser checks cover language, filters, charts, mobile layout and accessibility.

## Future linked cohort

Require stable identity with an audited crosswalk; protocol, speed, laterality and event quality for movement; measurement and available-at timestamps for training; adjudicated clinical episodes; complete eligible exposure; observed versus expected return; follow-up cutoffs and censoring. The future study must define its question and validation before fitting a combined model. Existing sources cannot retrospectively supply missing modalities for another person.
