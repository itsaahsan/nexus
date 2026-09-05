import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import pandas as pd
from app.engines.evidence_engine import analyze_dataframe
from app.engines.hypothesis_engine import generate_hypotheses
from app.engines.problem_parser import parse_problem
from app.engines.analysis import simulate, apply_feedback, build_recommendations
from app.services.pipeline import run_investigation

def test_parse():
    p = parse_problem("Service delays", "Long response times in south district with limited staff", "Cut delays", "low budget", "volunteers")
    assert p["investigation_questions"] and p["required_evidence"]

def test_evidence_missing_and_outliers():
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo_dataset.csv"))
    out = analyze_dataframe(df)
    assert out["profile"]["rows"] == 180
    assert len(out["evidence"]) >= 5
    assert any(e["kind"] == "anomaly" for e in out["evidence"])

def test_hypothesis_ranked():
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo_dataset.csv"))
    a = analyze_dataframe(df)
    p = parse_problem("t", "Long delays in community services with capacity strain", "o", "c", "r")
    h = generate_hypotheses(p, a["evidence"])
    assert len(h) == 5
    assert h[0]["confidence"] >= h[-1]["confidence"]
    assert all(0 <= x["confidence"] <= 1 for x in h)

def test_sim_deterministic():
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo_dataset.csv"))
    prof = analyze_dataframe(df)["profile"]
    r1 = simulate(prof, 65, 70, 4.0)
    r2 = simulate(prof, 65, 70, 4.0)
    assert r1 == r2
    assert "MODEL ESTIMATE" in r1["label"]

def test_recs_and_feedback():
    h = [{"title": "A", "confidence": 0.8, "impact": 0.6}]
    r = build_recommendations(h, {"descriptive": {}})
    assert r[0]["metric"] and r[0]["method"]
    f = apply_feedback(100, 82, "pilot done")
    assert f["change_pct"] == -18.0
    assert "effective" in f["verdict"].lower() or "positive" in f["verdict"].lower()

def test_pipeline_end_to_end():
    out = run_investigation("Service delays", "Community org must prioritize local service problems with limited resources", "cut response time", "low budget", "staff")
    assert out["hypotheses"] and out["graph"]["nodes"]
    assert len(out["log"]) == 6
