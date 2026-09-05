import os, io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db import get_db
from app import models_db as M
from app.schemas import ProjectCreate, SimulateRequest, FeedbackRequest
from app.services.pipeline import run_investigation
from app.engines.evidence_engine import analyze_dataframe
from app.engines.analysis import simulate, apply_feedback

router = APIRouter()
MAX_MB = float(os.getenv("MAX_UPLOAD_MB", "5"))

@router.get("/health")
def health():
    return {"status": "ok", "mode": os.getenv("LLM_PROVIDER", "demo")}

@router.post("/projects")
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    extra = ""
    if body.community: extra += f"\n\nCommunity/context: {body.community.strip()}"
    if body.timeframe: extra += f"\n\nTime period: {body.timeframe.strip()}"
    desc = (body.description.strip() + extra).strip()
    p = M.Project(title=body.title.strip(), description=desc,
                  objective=body.objective, constraints=body.constraints, resources=body.resources)
    db.add(p); db.commit(); db.refresh(p)
    return {"id": p.id, "title": p.title, "status": p.status}

@router.post("/projects/{pid}/investigate")
def investigate(pid: int, db: Session = Depends(get_db)):
    p = db.get(M.Project, pid)
    if not p:
        raise HTTPException(404, "Project not found")
    out = run_investigation(p.title, p.description, p.objective, p.constraints, p.resources)
    p.status = "investigated"
    db.add(M.InvestigationRun(project_id=pid, stage="done", log=out["log"],
                              summary={"hyps": len(out["hypotheses"]), "evidence": len(out["evidence"])}))
    for e in out["evidence"]:
        db.add(M.Evidence(project_id=pid, kind=e["kind"], title=e["title"][:300], detail=e["detail"],
                          source=e.get("source", "dataset"), confidence=e["confidence"], meta=e.get("meta", {})))
    for h in out["hypotheses"]:
        db.add(M.Hypothesis(project_id=pid, title=h["title"], statement=h["statement"], confidence=h["confidence"],
                            support=h["support"], contradiction=h["contradiction"], impact=h["impact"],
                            uncertainty=h["uncertainty"], evidence_ids=h["evidence_ids"]))
    for r in out["recommendations"]:
        db.add(M.Recommendation(project_id=pid, action=r["action"], rationale=r["rationale"], benefit=r["benefit"],
                                effort=r["effort"], risk=r["risk"], metric=r["metric"], method=r["method"],
                                deps=r["deps"], score=r["score"]))
    db.commit()
    return out

@router.get("/projects/{pid}")
def get_project(pid: int, db: Session = Depends(get_db)):
    p = db.get(M.Project, pid)
    if not p:
        raise HTTPException(404, "Project not found")
    ev = db.query(M.Evidence).filter_by(project_id=pid).all()
    hy = db.query(M.Hypothesis).filter_by(project_id=pid).order_by(M.Hypothesis.confidence.desc()).all()
    rc = db.query(M.Recommendation).filter_by(project_id=pid).order_by(M.Recommendation.score.desc()).all()
    sims = db.query(M.Simulation).filter_by(project_id=pid).all()
    outs = db.query(M.Outcome).filter_by(project_id=pid).all()
    return {"project": {"id": p.id, "title": p.title, "status": p.status, "description": p.description},
            "evidence": [{"id": e.id, "kind": e.kind, "title": e.title, "detail": e.detail, "confidence": e.confidence, "source": e.source} for e in ev],
            "hypotheses": [{"id": h.id, "title": h.title, "statement": h.statement, "confidence": h.confidence, "support": h.support, "contradiction": h.contradiction, "impact": h.impact, "uncertainty": h.uncertainty} for h in hy],
            "recommendations": [{"id": r.id, "action": r.action, "rationale": r.rationale, "benefit": r.benefit, "effort": r.effort, "risk": r.risk, "metric": r.metric, "method": r.method, "score": r.score} for r in rc],
            "simulations": [{"id": s.id, "name": s.name, "params": s.params, "result": s.result} for s in sims],
            "outcomes": [{"id": o.id, "baseline": o.baseline, "observed": o.observed, "change_pct": o.change_pct, "verdict": o.verdict} for o in outs]}

@router.get("/projects/{pid}/evidence")
def get_evidence(pid: int, db: Session = Depends(get_db)):
    return get_project(pid, db)["evidence"]

@router.get("/projects/{pid}/hypotheses")
def get_hyps(pid: int, db: Session = Depends(get_db)):
    return get_project(pid, db)["hypotheses"]

@router.get("/projects/{pid}/recommendations")
def get_recs(pid: int, db: Session = Depends(get_db)):
    return get_project(pid, db)["recommendations"]

@router.post("/projects/{pid}/simulate")
def run_sim(pid: int, body: SimulateRequest, db: Session = Depends(get_db)):
    p = db.get(M.Project, pid)
    if not p:
        raise HTTPException(404, "Project not found")
    from app.services.pipeline import load_default_dataset
    profile = analyze_dataframe(load_default_dataset())["profile"]
    results = []
    scenarios = body.scenarios or [
        {"name": "Baseline", "allocation_pct": 50, "coverage_pct": 50, "response_days_target": 7.0},
        {"name": "Option A", "allocation_pct": body.allocation_pct, "coverage_pct": body.coverage_pct, "response_days_target": body.response_days_target},
        {"name": "Option B", "allocation_pct": min(100, body.allocation_pct + 15), "coverage_pct": min(100, body.coverage_pct + 10), "response_days_target": max(0.5, body.response_days_target - 1)},
    ]
    for sc in scenarios:
        r = simulate(profile, sc["allocation_pct"], sc["coverage_pct"], sc["response_days_target"])
        db.add(M.Simulation(project_id=pid, name=sc["name"], params=sc, result=r))
        results.append({"name": sc["name"], "params": sc, "result": r})
    db.commit()
    return {"scenarios": results}

@router.post("/projects/{pid}/feedback")
def feedback(pid: int, body: FeedbackRequest, db: Session = Depends(get_db)):
    p = db.get(M.Project, pid)
    if not p:
        raise HTTPException(404, "Project not found")
    r = apply_feedback(body.baseline, body.observed, body.note)
    db.add(M.Outcome(project_id=pid, baseline=body.baseline, observed=body.observed,
                     change_pct=r["change_pct"], note=body.note, verdict=r["verdict"]))
    db.commit()
    return r

@router.post("/datasets/upload")
def upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only .csv files accepted")
    data = file.file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_MB} MB limit")
    try:
        df = pd.read_csv(io.BytesIO(data))
    except Exception:
        raise HTTPException(400, "Could not parse CSV")
    if len(df.columns) == 0 or len(df) == 0:
        raise HTTPException(400, "Empty dataset")
    out = analyze_dataframe(df, source=f"upload:{file.filename}")
    return {"profile": out["profile"], "evidence": out["evidence"]}
