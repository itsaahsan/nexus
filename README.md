# NEXUS — Autonomous Intelligence Command Center

**“Turn uncertainty into evidence-backed action.”**

Most AI systems wait for a question. NEXUS starts with a problem: it investigates messy
real-world situations, organizes evidence, ranks competing hypotheses, simulates interventions,
recommends actions a human reviews, measures outcomes, and learns — a closed, transparent loop.

> **Built for:** Global Innovation Build Challenge V2 — Track 03 (Open / General Technical Invention)

---

## Demo Video

<!-- 🎬 Paste your demo video link here (YouTube / Loom), e.g.: https://youtu.be/XXXX -->
**Demo video:** _coming soon — 2–3 min walkthrough: problem → evidence → hypotheses → simulation → action → feedback._

## Screenshots

<!-- 📸 Add your screenshots under docs/screenshots/ and they will render here. Suggested set: -->
| # | Screen | File |
|---|--------|------|
| 01 | Landing + intelligence graph | `docs/screenshots/01-landing.png` |
| 02 | Investigation command center | `docs/screenshots/02-command-center.png` |
| 03 | Evidence graph (node inspected) | `docs/screenshots/03-evidence-graph.png` |
| 04 | Hypothesis Lab ranking | `docs/screenshots/04-hypothesis-lab.png` |
| 05 | Scenario Lab before/after | `docs/screenshots/05-scenario-lab.png` |
| 06 | Action Center + human review | `docs/screenshots/06-action-center.png` |
| 07 | Outcome Center + receipt | `docs/screenshots/07-outcome-center.png` |

---

## Problem

Community organizations, nonprofits and local service teams must decide where limited
resources go — food, education, outreach, transport, emergency support — while facing
incomplete, messy, conflicting and changing information. Raw dashboards don't recommend;
chatbots answer without an evidence trail; single-number predictions hide uncertainty.

## Solution

NEXUS is an autonomous decision-intelligence system. Give it a messy problem and it:

1. **Structures** it (objective, constraints, unknowns, investigation questions)
2. **Gathers evidence** (pandas/NumPy profiling: trends, gaps, outliers, correlations)
3. **Ranks competing hypotheses** with evidence-weighted investigation scores
4. **Simulates interventions** (Baseline vs A vs B — labeled model estimates)
5. **Recommends actions** a human must Accept / Modify / Reject
6. **Measures outcomes** and computes what changed
7. **Learns** — the feedback loop updates future recommendations

## Why NEXUS?

Traditional AI: `Question → Answer` (one answer, no receipts).
NEXUS: `Problem → Evidence → Hypotheses → Simulation → Action → Outcome → Learning`
(every step visible, every estimate labeled, humans decide).

## Core Workflow

PROBLEM → INVESTIGATE → COLLECT EVIDENCE → DISCOVER PATTERNS → GENERATE HYPOTHESES →
RANK → ROOT-CAUSE ESTIMATES → SIMULATE → RECOMMEND → HUMAN REVIEW → MEASURE → LEARN → ADAPT

## Social Impact

Built around **community service prioritization**: which neighborhoods need outreach most
under limited staff and budget. NEXUS is decision *support* — it never replaces community
leaders. Every recommendation ships with evidence, uncertainty, assumptions, and a required
human review step. See the in-app *Social impact* section.

## Features

- **Command center**: sidebar nav, `⌘K` command palette, live backend status, dark/light
- **Problem intake**: title, description, community/context, objective, constraints, resources, time window, CSV attach
- **Evidence Explorer**: search, filters (supporting/anomalies/high/low), sort, inspect cards, relationship graph with inspector
- **Dataset Lab**: real profile — rows, columns, missing count, numeric/categorical, distributions, outliers
- **Hypothesis Lab**: ranked cards with support/contradict/impact/uncertainty, comparison table, view-reasoning dialogs, cautious root-cause map
- **Scenario Lab**: intensity/allocation/horizon sliders, bar comparison + confidence-band charts, Before/After cards, assumptions listed
- **Action Center**: priority actions with Accept-for-testing / Modify / Reject + per-action status (Recommended → Testing → Completed/Rejected)
- **Outcome Center**: expected vs actual, difference, verdict, learning note, PLAN→ACT→MEASURE→LEARN→ADAPT loop
- **Extras**: investigation timeline, downloadable **investigation receipt (JSON)**, localStorage history, human-in-the-loop banner

## Architecture

```mermaid
flowchart TD
  U[User] --> FE[React Application]
  FE --> API[FastAPI]
  API --> ORCH[Investigation Orchestrator]
  ORCH --> EE[Evidence Engine]
  ORCH --> HE[Hypothesis Engine]
  ORCH --> SE[Simulation Engine]
  EE --> REC[Recommendation]
  HE --> REC
  SE --> REC
  REC --> DB[(PostgreSQL / SQLite)]
  DB --> FB[Feedback Engine]
  FB --> LOOP[Updated Investigation]
```

Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) ·
[`docs/VALIDATION.md`](docs/VALIDATION.md) · [`docs/DEMO.md`](docs/DEMO.md)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide icons
- **Backend**: Python, FastAPI, Pydantic, SQLAlchemy (PostgreSQL-compatible; SQLite locally)
- **Data**: pandas, NumPy · **Tests**: pytest (8 tests) · **AI**: provider abstraction (`LLM_PROVIDER=demo|generic`)

## AI Architecture

`backend/app/ai/provider.py` defines `AIProvider`. **Demo Mode** (`LLM_PROVIDER=demo`, default)
uses deterministic local algorithms + synthetic data — no key needed, works offline.
**Live Mode** (`LLM_PROVIDER=generic` + `GENERIC_LLM_URL`/`GENERIC_LLM_KEY`) calls your
endpoint and degrades safely to deterministic output when unreachable. AI output is validated
structured data; raw model text is never rendered directly. Keys stay server-side via env vars.

## Demo Mode

One click (**Run Demo**) loads the community-service scenario and executes the full loop in
~10 seconds. Data is `data/demo_dataset.csv` — **synthetic**, engineered with trends,
anomalies and category gaps, clearly labeled DEMO DATASET in the UI.

## Accessibility

Skip link, semantic landmarks, keyboard-operable graph/palette, visible focus rings,
`aria-live` statuses, `prefers-reduced-motion` support, labeled inputs, honest
(non-color-only) status indicators.

## Privacy

Avoid entering personal data. Demo data is fictional. Uploaded CSVs stay in your own
deployment; API keys remain server-side env vars and are never committed.

## Security

Env-based secrets, `.env.example`, input validation (422s), CSV type/size limits,
CORS config, safe error messages (no stack traces), no secrets in git.

## Installation

Requires Python 3.11+ and Node 18+.

```bash
# backend
cd nexus/backend && pip install -r requirements.txt
# frontend
cd ../frontend && npm install
```

## Environment Variables

Backend — copy `backend/.env.example` → `backend/.env`:

```
DATABASE_URL=sqlite:///./nexus.db        # or postgresql://user:pass@host:5432/nexus
LLM_PROVIDER=demo                        # demo | generic
GENERIC_LLM_URL=                         # live-mode endpoint (optional)
GENERIC_LLM_KEY=                         # live-mode key (optional, never commit)
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_MB=5
```

Frontend — optional `frontend/.env`: `VITE_API_URL=http://localhost:8000/api`

## Running Locally

```bash
# terminal 1 — backend (http://localhost:8000)
cd nexus/backend && python -m uvicorn app.main:app --port 8000
# terminal 2 — frontend (http://localhost:5173)
cd nexus/frontend && npm run dev
```

Then click **Run Demo**. API docs: `http://localhost:8000/docs`.

## Testing

```bash
cd nexus/backend && python -m pytest tests -q   # 8 tests
cd ../frontend && npm run build                  # tsc + vite, must be clean
```

## Deployment

- **Frontend → Vercel**: import repo, root `nexus/frontend`, set `VITE_API_URL` to the backend URL.
- **Backend → Render/Railway**: see `render.yaml` (Docker-less Python service + Postgres). Set `DATABASE_URL` and `LLM_PROVIDER=demo`.
- **Database**: any PostgreSQL (Supabase/Neon free tiers work via `DATABASE_URL`).

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Status + mode |
| POST | `/api/projects` | Create problem (validated) |
| POST | `/api/projects/{id}/investigate` | Run full pipeline |
| GET | `/api/projects/{id}` | Bundle: evidence, hypotheses, recs, sims, outcomes |
| GET | `/api/projects/{id}/evidence` | Evidence list |
| GET | `/api/projects/{id}/hypotheses` | Ranked hypotheses |
| GET | `/api/projects/{id}/recommendations` | Action plan |
| POST | `/api/projects/{id}/simulate` | Baseline/A/B scenarios (estimates) |
| POST | `/api/projects/{id}/feedback` | Record outcome → verdict |
| POST | `/api/datasets/upload` | CSV auto-analysis |

## Dataset

`data/demo_dataset.csv` — 180 rows × 8 columns (date, category, district, requests,
resolved, response_days, satisfaction, resource_hours) with injected anomalies + missing
values. **Synthetic demo data, never real-world evidence.**

## Limitations

- Simulations are linear model estimates, not causal guarantees.
- Scores rank explanations; they are not probabilities and correlation ≠ causation.
- Demo data is synthetic; production needs real measurement design.
- No auth/multi-user; SQLite default (Postgres via env).
- Unmeasured metrics are labeled “Not yet measured” in `docs/VALIDATION.md`.

## Ethics

Uncertain outputs are labeled estimates; synthetic data is marked; recommendations require
human review; no personal data is collected; no dark patterns. See in-app human-review banner.

## Future Roadmap

- [ ] Real LLM reasoning behind the provider abstraction (structured, validated)
- [ ] Causal upgrades (propensity scoring, difference-in-differences)
- [ ] Auth + shared workspaces, Postgres-hosted prod
- [ ] Scheduled re-evaluation + alerting on drift
- [ ] PDF receipt export, more demo domains (health, education)

## License

MIT — see [LICENSE](LICENSE).
