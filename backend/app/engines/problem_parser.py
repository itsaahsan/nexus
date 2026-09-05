"""Deterministic problem parser: text -> structured representation."""
import re

STOP = {"the","a","an","and","or","to","of","in","with","for","on","is","are","need","needs"}

def parse_problem(title: str, description: str, objective: str, constraints: str, resources: str) -> dict:
    text = f"{title}. {description} {objective}".lower()
    words = re.findall(r"[a-z]{4,}", text)
    keywords = []
    for w in words:
        if w not in STOP and w not in keywords:
            keywords.append(w)
        if len(keywords) >= 8:
            break
    unknowns = []
    if "why" in text or "cause" in text or "reason" in text:
        unknowns.append("Causal mechanism behind the observed pattern")
    unknowns += ["Which subgroup/category drives the effect", "Whether observed association is confounded", "Cost/benefit of candidate interventions"]
    required = [
        "Historical measurements of the target indicator over time",
        "Category / subgroup breakdown",
        "Temporal patterns and anomalies",
        "Resource / capacity information",
        "Outcome metric definition and baseline",
    ]
    questions = [
        "What factors appear to be associated with the observed problem?",
        "Which categories or subgroups show the largest gaps?",
        "Are there temporal trends or anomalies?",
        "What relationships hold after basic cross-checks?",
        "Which intervention would give the best evidence-weighted return?",
    ]
    return {
        "problem": title.strip(),
        "objective": objective.strip() or "Identify highest-impact actions under limited resources.",
        "constraints": constraints.strip() or "Limited resources; must prioritize measurably.",
        "resources_text": resources.strip(),
        "keywords": keywords,
        "unknowns": unknowns[:5],
        "required_evidence": required,
        "investigation_questions": questions,
    }
