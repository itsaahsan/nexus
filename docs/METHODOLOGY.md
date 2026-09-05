# Methodology

## Evidence representation

Evidence items `{kind, title, detail, source, confidence, meta}` derive from real pandas
profiling: descriptives, IQR outliers, category skews, pairwise correlations (|r|≥0.35),
linear trend fits, missing-data notes. Each item cites its source column(s).

## Hypothesis generation

Five fixed competing templates (capacity, access, quality, demand shock, data artifact)
are scored against the actual evidence set: keyword overlap + evidence-kind matching gives
`support`/`contradiction` counts; confidence = 0.25 + 0.6·support_ratio − 0.3·contra_ratio
(+ small prior), clamped to [0.05, 0.95]. Sorted descending.

## Confidence calculation

Deterministic formula above; `uncertainty = 0.65 − 0.3·support_ratio + 0.2·contra_ratio`.
All scores labeled estimates in the UI.

## Simulations

`simulate(profile, allocation, coverage, response_target)`: baseline = mean of first numeric
column; impact = 0.35·alloc_lift + 0.20·cover_lift + 0.15·speed_lift, clamped [−0.2, 0.8].
Cost/risk/uncertainty are documented index formulas. Output labeled MODEL ESTIMATE.

## Limitations & uncertainty handling

Cautious language throughout ("Evidence suggests…", "Insufficient evidence to establish
causation…"). Correlations reported with explicit non-causal caveats. Confounders and
unknowns listed separately. Feedback verdicts use thresholds (−10%/−3%) and advise
continued measurement when inconclusive.
