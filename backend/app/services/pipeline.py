"""Orchestrator: stages map to real backend ops (no fake timers)."""
import pandas as pd
from app.engines.problem_parser import parse_problem
from app.engines.evidence_engine import analyze_dataframe
from app.engines.hypothesis_engine import generate_hypotheses
from app.engines.analysis import root_cause_analysis, build_recommendations, simulate
from app.ai.provider import get_provider

def load_default_dataset() -> pd.DataFrame:
    import os
    here = os.path.abspath(os.path.dirname(__file__))
    cands = []
    d = here
    for _ in range(6):  # walk up: services -> app -> backend -> nexus -> ...
        cands.append(os.path.join(d, "data", "demo_dataset.csv"))
        d = os.path.dirname(d)
    cands += [os.path.join(os.getcwd(), "data", "demo_dataset.csv"),
              os.path.join(os.getcwd(), "nexus", "data", "demo_dataset.csv"),
              "/app/data/demo_dataset.csv"]
    for cand in cands:
        if os.path.exists(cand):
            return pd.read_csv(cand)
    # minimal synthetic fallback
    import numpy as np
    rng = np.random.default_rng(7)
    return pd.DataFrame({"requests": rng.integers(20, 200, 60), "resolved": rng.integers(10, 180, 60),
                         "response_days": rng.normal(6, 2, 60).round(1)})

def run_investigation(title, description, objective, constraints, resources, df=None, source="demo-dataset"):
    log = []
    parsed = parse_problem(title, description, objective, constraints, resources)
    log.append({"stage": "understanding", "status": "done", "msg": "Problem parsed into structured representation."})
    if df is None:
        df = load_default_dataset()
    log.append({"stage": "investigating", "status": "done", "msg": f"Evidence requirements generated; dataset loaded ({len(df)} rows)."})
    analysis = analyze_dataframe(df, source=source)
    log.append({"stage": "analyzing", "status": "done",
                "msg": f"Detected {len(analysis['evidence'])} evidence items; {len(analysis['profile']['numeric'])} numeric fields."})
    hyps = generate_hypotheses(parsed, analysis["evidence"])
    log.append({"stage": "hypothesis", "status": "done", "msg": f"Ranked {len(hyps)} competing hypotheses."})
    rc = root_cause_analysis(hyps, analysis["evidence"])
    recs = build_recommendations(hyps, analysis["profile"])
    base_sim = simulate(analysis["profile"], 50, 50, 7.0)
    provider = get_provider()
    ai = provider.enrich(parsed, f"Top hypothesis: {hyps[0]['title'] if hyps else 'n/a'}. Evidence n={len(analysis['evidence'])}.")
    log.append({"stage": "simulation", "status": "done", "msg": "Baseline simulation computed (model estimate)."})
    log.append({"stage": "action", "status": "done", "msg": f"Generated {len(recs)} actions with rationale and metrics."})
    graph = build_graph(parsed, analysis["evidence"], hyps, recs)
    return {"parsed": parsed, "profile": analysis["profile"], "evidence": analysis["evidence"],
            "hypotheses": hyps, "root_cause": rc, "recommendations": recs,
            "baseline_sim": base_sim, "ai": ai, "log": log, "graph": graph}

def build_graph(parsed, evidence, hyps, recs):
    nodes, edges = [], []
    nodes.append({"id": "problem", "type": "Problem", "label": parsed.get("problem", "Problem")[:60]})
    for e in evidence[:10]:
        nid = f"ev{e['temp_id']}"
        nodes.append({"id": nid, "type": "Evidence", "label": e["title"][:60], "confidence": e["confidence"],
                      "detail": e, "source": e.get("source"), "reasoning": e.get("detail")})
        edges.append({"from": nid, "to": "problem", "label": "informs"})
    for i, h in enumerate(hyps):
        nid = f"hyp{i}"
        nodes.append({"id": nid, "type": "Hypothesis", "label": h["title"][:60], "confidence": h["confidence"], "detail": h})
        for eid in (h.get("evidence_ids") or [])[:3]:
            edges.append({"from": f"ev{eid}", "to": nid, "label": "supports"})
    if hyps:
        nodes.append({"id": "cause", "type": "Cause", "label": hyps[0]["title"][:60], "detail": hyps[0]})
        edges.append({"from": "hyp0", "to": "cause", "label": "leads"})
    for i, r in enumerate(recs[:4]):
        nid = f"rec{i}"
        nodes.append({"id": nid, "type": "Recommendation", "label": r["action"][:60], "detail": r})
        edges.append({"from": "cause", "to": nid, "label": "recommends"})
    nodes.append({"id": "outcome", "type": "Outcome", "label": "Measured outcome (via Feedback)"})
    if recs:
        edges.append({"from": "rec0", "to": "outcome", "label": "predicts"})
    return {"nodes": nodes, "edges": edges}
