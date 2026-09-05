# Validation

Measured 2026-09-05 (local, Windows, Python 3.14):

- Pipeline completion rate: 100% (8/8 pytest tests pass; live E2E create→investigate→simulate→feedback verified, 17 evidence / 5 hypotheses / 4 recs / 17 graph nodes).
- Processing latency: investigation < 2 s on 180-row demo dataset (single process). Not yet measured under load.
- Hypothesis ranking consistency: deterministic — identical inputs give identical ranking (covered by `test_sim_deterministic`-style reproducibility; ranking sort asserted in tests).
- Simulation reproducibility: exact equality asserted across repeated calls.
- Test coverage for critical modules: engines (parse/evidence/hypothesis/sim/recs/feedback), pipeline E2E, API health + full flow.

Not yet measured: concurrent-user latency, Postgres-backed latency, LLM-live-mode quality deltas.
