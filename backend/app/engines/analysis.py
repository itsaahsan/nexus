"""Root-cause + recommendation + simulation + feedback engines (deterministic)."""

def root_cause_analysis(hyps: list[dict], evidence: list[dict]) -> dict:
    top = hyps[0] if hyps else {}
    corr_ev = [e for e in evidence if "association" in e.get("title", "").lower()]
    return {
        "likely_root": {"title": top.get("title", "Unknown"), "confidence": top.get("confidence", 0),
                        "wording": f"Evidence suggests '{top.get('title','—')}' is the leading explanation (confidence {round((top.get('confidence') or 0)*100)}%). This is an estimate, not a proven cause."},
        "direct_causes": [top.get("title", "—")] if top else [],
        "contributing_factors": [h["title"] for h in hyps[1:3]],
        "correlations": [{"pair": e["meta"].get("pair"), "r": e["meta"].get("r"),
                          "note": "Correlation only — insufficient evidence to establish causation."} for e in corr_ev[:5]],
        "confounders": ["Reporting/missing-data artifacts", "Seasonal or external demand effects", "Unmeasured subgroup differences"],
        "unknowns": ["True causal effect sizes", "Cost эластичности placeholder".replace(" эластичности placeholder",""), "Long-run persistence of effects"],
        "caveat": "Do not interpret correlations as proof of causation. All causes are provisional and evidence-weighted.",
    }

def build_recommendations(hyps: list[dict], profile: dict) -> list[dict]:
    top = hyps[0] if hyps else {"title": "Capacity bottleneck hypothesis", "confidence": 0.6, "impact": 0.6}
    conf = top.get("confidence", 0.5)
    recs = [
        {"action": "Prioritize the highest-gap category/area for targeted capacity boost",
         "rationale": f"Highest evidence-weighted expected impact; supports '{top.get('title')}' (confidence {round(conf*100)}%).",
         "benefit": round(0.5 + 0.4 * conf, 3), "effort": "medium", "risk": "medium",
         "metric": "Reduce mean response time by 20% in target group within 8 weeks",
         "method": "Compare baseline vs post-intervention mean on same cohort; track weekly.",
         "deps": ["Baseline measurement", "Capacity roster"], "score": round(0.4 + 0.5 * conf, 3)},
        {"action": "Run outreach pilot to under-served subgroups",
         "rationale": "Tests access-gap hypothesis with low cost; falsifiable within 4 weeks.",
         "benefit": 0.45, "effort": "low", "risk": "low",
         "metric": "Increase service uptake in pilot subgroup by 15%",
         "method": "Pilot vs matched comparison group; difference-in-means.",
         "deps": ["Contact list", "Comms channel"], "score": 0.55},
        {"action": "Audit triage/follow-through quality on sampled cases",
         "rationale": "Checks process-quality hypothesis; distinguishes capacity vs quality effects.",
         "benefit": 0.4, "effort": "low", "risk": "low",
         "metric": "Close 30% of preventable re-open cases",
         "method": "Blinded case review rubric; inter-rater agreement reported.",
         "deps": ["Case sample", "Review rubric"], "score": 0.5},
        {"action": "Fix reporting gaps and add validation to intake forms",
         "rationale": "Reduces data-artifact confounder; improves future estimates.",
         "benefit": 0.3, "effort": "low", "risk": "low",
         "metric": "Missing-field rate below 5%",
         "method": "Automated completeness dashboard.",
         "deps": ["Form access"], "score": 0.45},
    ]
    recs.sort(key=lambda r: r["score"], reverse=True)
    return recs

def simulate(profile: dict, allocation_pct: float, coverage_pct: float, response_days_target: float) -> dict:
    """Deterministic model estimate. Clearly labeled as estimate."""
    desc = profile.get("descriptive", {})
    first = next(iter(desc.values()), {"mean": 100})
    baseline = float(first.get("mean", 100))
    # elasticities (documented assumptions)
    alloc_lift = (allocation_pct - 50) / 50 * 0.35   # +35% max lift at 100%
    cover_lift = (coverage_pct - 50) / 50 * 0.20
    speed_lift = max(0.0, (7 - response_days_target) / 7) * 0.15
    impact = round(max(-0.2, min(0.8, alloc_lift + cover_lift + speed_lift)), 4)
    cost = round((allocation_pct / 100) * 0.6 + (coverage_pct / 100) * 0.4, 4)
    risk = round(min(0.9, 0.15 + abs(allocation_pct - 65) / 100 + abs(coverage_pct - 70) / 150), 3)
    unc = round(min(0.6, 0.25 + 0.2 * abs(impact) + 0.1 * risk), 3)
    projected = round(baseline * (1 - 0.5 * impact), 3)  # lower target metric is better (e.g. response days)
    return {"baseline": baseline, "expected_impact_pct": round(impact * 100, 2),
            "resource_cost_index": cost, "risk": risk, "uncertainty": unc,
            "projected_value": projected, "label": "MODEL ESTIMATE — not a guarantee",
            "assumptions": ["Linear elasticity of outcome to allocation/coverage", "No external shocks", "Measurement consistent with baseline"]}

def apply_feedback(baseline: float, observed: float, note: str) -> dict:
    change = ((observed - baseline) / baseline * 100) if baseline else 0.0
    change = round(change, 2)
    if change <= -10:
        verdict = "Appears effective — target metric improved materially."
    elif change <= -3:
        verdict = "Weakly positive — continue and expand measurement."
    elif abs(change) < 3:
        verdict = "Inconclusive — insufficient change; check adherence/measurement."
    else:
        verdict = "No improvement detected — reconsider hypothesis ranking."
    return {"baseline": baseline, "observed": observed, "change_pct": change,
            "verdict": verdict, "note": note,
            "next": "PLAN → ACT → MEASURE → LEARN → ADAPT: update priorities toward the best-measured lever."}
