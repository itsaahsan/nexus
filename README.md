# NEXUS — Autonomous Real-World Problem Solver

**“From messy information to measurable action.”**

Most AI tools wait for users to ask questions. NEXUS starts with a problem: it decomposes it,
investigates structured evidence, ranks competing hypotheses, estimates root causes, simulates
interventions, recommends actions with explanations, and learns from measured outcomes.

Central innovation: an **Evidence → Hypothesis → Simulation → Action → Feedback loop**.

## Problem

Decision-makers facing messy real-world problems (e.g. which community services to prioritize
under limited resources) get either raw dashboards with no guidance or chatbot answers with no
evidence trail.

## Why Existing Approaches Fall Short

- Chatbots answer questions but don't investigate autonomously.
- Dashboards show numbers but don't rank causes or simulate trade-offs.
- Single-answer AI hides uncertainty and never tracks whether advice worked.

## Our Solution

NEXUS: problem intake → autonomous investigation → evidence graph → competing hypotheses →
root-cause analysis → what-if simulator → action plan → decision explainer → feedback loop.

## Key Innovation

The closed **Evidence → Hypothesis → Simulation → Action → Feedback** loop: every
recommendation carries its evidence, every simulation is labeled an estimate, every outcome
measurement updates the verdict. Demo Mode is fully deterministic (no API keys needed).

## Architecture

```mermaid
flowchart TD
  U[User] --> FE[React Frontend]
  FE --> API[FastAPI]
  API --> ORCH[Investigation Orchestrator]
  ORCH --> EE[Evidence Engine]
  ORCH --> HE[Hypothesis Engine]
  ORCH --> SE[Simulation Engine]
  EE --> DB[(PostgreSQL / SQLite-compat)]
  HE --> DB
  SE --> REC[Recommendation Engine]
  REC --> DB
  DB --> FB[Feedback Engine]
  FB --> REC
```

See `docs/ARCHITECTURE.md`, `docs/METHODOLOGY.md`, `docs/DEMO.md`, `docs/VALIDATION.md`.

## Technology

Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts. Backend: Python, FastAPI,
Pydantic, SQLAlchemy (PostgreSQL-compatible; SQLite default for local demo), pandas, NumPy.
Tests: pytest (8 tests). AI: provider abstraction (`LLM_PROVIDER=demo|generic`), never hard-coded keys.

## Installation

Requires Python 3.11+ and Node 18+.

```bat
cd nexus\backend
pip install -r requirements.txt
cd ..\frontend
npm install
```

## Environment Variables

Backend (`backend/.env`, see `.env.example`):

```
DATABASE_URL=sqlite:///./nexus.db
LLM_PROVIDER=demo
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_MB=5
```

For PostgreSQL: `DATABASE_URL=postgresql://user:pass@host:5432/nexus`.
Frontend: `VITE_API_URL=http://localhost:8000/api` (optional `.env` file).

## Running Locally

```bat
cd nexus\backend
python -m uvicorn app.main:app --port 8000
cd ..\frontend
npm run dev
```

Open http://localhost:5173 → click **Run Demo Investigation**.

## Demo Mode

One click runs the full pipeline on the bundled synthetic dataset (`data/demo_dataset.csv`,
180 rows, clearly synthetic) with deterministic local algorithms. No keys required.

## Live AI Mode

Set `LLM_PROVIDER=generic` plus `GENERIC_LLM_URL`/`GENERIC_LLM_KEY` (see `.env.example`).
The provider interface (`backend/app/ai/provider.py`) degrades safely to deterministic
synthesis when unconfigured, so the demo never breaks.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/projects` | Create problem |
| POST | `/api/projects/{id}/investigate` | Run full pipeline |
| GET | `/api/projects/{id}` | Project + evidence + hypotheses + recs |
| GET | `/api/projects/{id}/evidence` | Evidence list |
| GET | `/api/projects/{id}/hypotheses` | Ranked hypotheses |
| GET | `/api/projects/{id}/recommendations` | Action plan |
| POST | `/api/projects/{id}/simulate` | Scenario comparison (estimates) |
| POST | `/api/projects/{id}/feedback` | Record outcome, get verdict |
| POST | `/api/datasets/upload` | CSV upload + auto-analysis |

## Dataset

`data/demo_dataset.csv` — **synthetic demo data** (service requests by category/district with
response times, satisfaction, resource hours, injected anomalies + missing values). Never
presented as real-world evidence.

## Testing

```bat
cd nexus\backend
python -m pytest tests -q     :: 8 tests, all passing
cd ..\frontend
npm run build                 :: tsc --noEmit + vite build, clean
```

## Limitations

- Simulations are linear model estimates, not causal guarantees.
- Root causes are evidence-weighted hypotheses; correlation is never claimed as causation.
- Demo data is synthetic; real deployments need real measurement design.
- Auth/multi-user and background job queue are out of scope for the MVP.

## Ethical Considerations

Uncertain outputs are labeled estimates; no fabricated certainty. No personal data in demo
dataset. Uploaded CSVs are size/type restricted and parsed safely. No secrets in repo.

## Future Work

Real LLM reasoning traces behind the abstraction, causal-inference upgrades (propensity/DID),
auth + project sharing, scheduled re-evaluation, Postgres-hosted prod deploy.

## Demo Video

Record 2–5 min following `docs/DEMO.md` (script included).

## Screenshots

Capture: landing/command center, evidence graph, hypothesis ranking, simulator, action plan,
feedback verdict (see screenshot checklist in `docs/DEMO.md`).

## License

MIT — see `LICENSE`.
