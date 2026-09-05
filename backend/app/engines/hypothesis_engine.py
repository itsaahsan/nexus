"""Hypothesis engine: competing hypotheses scored on actual evidence."""
import re

TEMPLATES = [
    ("Capacity bottleneck hypothesis",
     "Observed gaps are driven primarily by limited service capacity in high-demand categories/areas. Evidence suggests backlogs raise response times and depress outcomes."),
    ("Access/awareness gap hypothesis",
     "Observed gaps are driven by uneven access or awareness across subgroups. Evidence suggests some groups underuse services rather than lacking capacity."),
    ("Process quality hypothesis",
     "Observed gaps reflect process/quality variation (triage, follow-through) rather than volume. Evidence suggests resolution rates vary even at similar demand levels."),
    ("External demand shock hypothesis",
     "Observed spikes reflect external demand surges (seasonal/events) rather than structural failure. Evidence suggests temporal clustering of anomalies."),
    ("Data artifact hypothesis",
     "Part of the observed pattern may reflect reporting/missing-data artifacts. Insufficient evidence to rule this out; treat as confounder check."),
]

def _kw_overlap(text: str, ev: dict) -> int:
    words = set(re.findall(r"[a-z]{4,}", text.lower()))
    blob = (ev.get("title", "") + " " + ev.get("detail", "")).lower()
    return sum(1 for w in words if w in blob)

def generate_hypotheses(parsed: dict, evidence: list[dict]) -> list[dict]:
    blob = " ".join([parsed.get("problem", ""), parsed.get("objective", "")])
    hyps = []
    for i, (title, stmt) in enumerate(TEMPLATES):
        support = 0
        contra = 0
        for ev in evidence:
            s = _kw_overlap(title + " " + stmt + " " + blob, ev)
            kind = ev.get("kind", "")
            if s > 0 or kind in ("observation", "anomaly"):
                # anomaly evidence slightly contradicts "data artifact"? no: supports artifact check
                if "artifact" in title.lower() and kind != "observation":
                    contra += 1
                else:
                    support += 1 if s > 0 else 0
            if "Missing" in ev.get("title", "") and "artifact" in title.lower():
                support += 2
        # base scores deterministic from evidence counts
        n = max(1, len(evidence))
        raw_support_ratio = min(1.0, support / max(1, n * 0.4))
        contra_ratio = min(1.0, contra / max(1, n * 0.3))
        confidence = round(max(0.05, min(0.95, 0.25 + 0.6 * raw_support_ratio - 0.3 * contra_ratio + (0.05 if i < 2 else -0.02 * i))), 3)
        impact = round(min(1.0, 0.3 + 0.15 * raw_support_ratio + (0.25 if i == 0 else 0.1 if i == 1 else 0.05)), 3)
        uncertainty = round(max(0.1, min(0.9, 0.65 - 0.3 * raw_support_ratio + 0.2 * contra_ratio)), 3)
        ev_ids = [e["temp_id"] for e in evidence[:6]]
        hyps.append({"title": title, "statement": stmt, "confidence": confidence,
                     "support": int(support), "contradiction": int(contra),
                     "impact": impact, "uncertainty": uncertainty, "evidence_ids": ev_ids})
    hyps.sort(key=lambda h: h["confidence"], reverse=True)
    return hyps
