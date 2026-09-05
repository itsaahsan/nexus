import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["DATABASE_URL"] = "sqlite:///./test_nexus.db"
if os.path.exists("./test_nexus.db"):
    os.remove("./test_nexus.db")
from fastapi.testclient import TestClient
from app.main import app
from app.db import Base, engine
from app import models_db  # noqa
Base.metadata.create_all(bind=engine)
c = TestClient(app)

def test_health():
    assert c.get("/api/health").status_code == 200

def test_full_flow():
    r = c.post("/api/projects", json={"title": "Service delays", "description": "Community org with limited resources must prioritize service problems", "objective": "cut delays"})
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    inv = c.post(f"/api/projects/{pid}/investigate")
    assert inv.status_code == 200, inv.text
    assert len(inv.json()["hypotheses"]) == 5
    sim = c.post(f"/api/projects/{pid}/simulate", json={"allocation_pct": 65, "coverage_pct": 70, "response_days_target": 4})
    assert sim.status_code == 200
    assert len(sim.json()["scenarios"]) == 3
    fb = c.post(f"/api/projects/{pid}/feedback", json={"baseline": 100, "observed": 82, "note": "pilot"})
    assert fb.json()["change_pct"] == -18.0
