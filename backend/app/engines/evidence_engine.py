"""Evidence engine: real pandas/numpy analysis -> evidence items + observations + stats."""
import pandas as pd
import numpy as np

MAX_ROWS = 20000

def _iqr_outliers(s: pd.Series) -> int:
    s = s.dropna()
    if len(s) < 8:
        return 0
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return 0
    return int(((s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)).sum())

def analyze_dataframe(df: pd.DataFrame, source: str = "dataset") -> dict:
    df = df.copy()
    if len(df) > MAX_ROWS:
        df = df.sample(MAX_ROWS, random_state=42)
    numeric = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    profile = {
        "rows": int(len(df)),
        "columns": list(df.columns),
        "numeric": numeric,
        "categorical": categorical,
        "missing": {c: int(df[c].isna().sum()) for c in df.columns},
        "missing_pct": {c: round(float(df[c].isna().mean() * 100), 2) for c in df.columns},
    }
    desc = {}
    for c in numeric:
        s = df[c].dropna()
        if len(s):
            desc[c] = {"mean": round(float(s.mean()), 3), "median": round(float(s.median()), 3),
                       "std": round(float(s.std() or 0), 3), "min": round(float(s.min()), 3),
                       "max": round(float(s.max()), 3), "outliers_iqr": _iqr_outliers(s)}
    profile["descriptive"] = desc
    cat_dist: dict = {}
    for c in categorical[:4]:
        vc = df[c].value_counts(dropna=False).head(8)
        cat_dist[c] = [{"value": str(k), "count": int(v)} for k, v in vc.items()]
    profile["category_dist"] = cat_dist
    corrs: dict = {}
    if len(numeric) >= 2:
        corr = df[numeric].corr(numeric_only=True).round(3)
        for i, a in enumerate(numeric):
            for b in numeric[i + 1:]:
                v = corr.loc[a, b]
                if pd.notna(v):
                    corrs[f"{a}~{b}"] = float(v)
    profile["correlations"] = corrs
    # temporal trend: pick date-like col if exists else index order on first numeric
    trend = {}
    date_col = next((c for c in df.columns if "date" in c.lower() or "time" in c.lower()), None)
    target = numeric[0] if numeric else None
    if target:
        y = df[target].dropna().to_numpy(dtype=float)
        if len(y) >= 6:
            x = np.arange(len(y))
            slope = float(np.polyfit(x, y, 1)[0])
            trend = {"target": target, "slope_per_row": round(slope, 4),
                     "direction": "increasing" if slope > 0 else ("decreasing" if slope < 0 else "flat")}
    profile["trend"] = trend

    evidence: list[dict] = []
    eid = 1
    def add(kind, title, detail, conf, meta=None):
        nonlocal eid
        evidence.append({"temp_id": eid, "kind": kind, "title": title, "detail": detail,
                         "source": source, "confidence": conf, "meta": meta or {}})
        eid += 1
    for c, d in desc.items():
        add("observation", f"Distribution of {c}: mean {d['mean']}, median {d['median']}",
            f"std={d['std']}, range [{d['min']}, {d['max']}], IQR outliers={d['outliers_iqr']}.",
            0.85, {"column": c, "stats": d})
        if d["outliers_iqr"] > 0:
            add("anomaly", f"{d['outliers_iqr']} outlier(s) detected in {c}",
                "Values outside 1.5xIQR. Evidence suggests special cases worth inspecting; not proof of a cause.",
                0.7, {"column": c, "count": d["outliers_iqr"]})
    for c, dist in cat_dist.items():
        if len(dist) >= 2:
            top = dist[0]
            add("observation", f"Category skew in {c}: '{top['value']}' dominates ({top['count']} rows)",
                "Uneven distribution across categories; potential prioritization lever.",
                0.75, {"column": c, "dist": dist})
    for pair, r in corrs.items():
        if abs(r) >= 0.35:
            direction = "positive" if r > 0 else "negative"
            add("observation", f"{direction} association {pair} (r={r})",
                "Evidence suggests association. Insufficient evidence to establish causation; confounders possible.",
                round(min(0.8, 0.5 + abs(r) * 0.4), 2), {"pair": pair, "r": r})
    if trend:
        add("observation", f"Temporal trend in {trend['target']}: {trend['direction']} (slope {trend['slope_per_row']}/row)",
            "Trend estimated by linear fit on row order. Treat as descriptive, not causal.",
            0.65, {"trend": trend})
    miss = [c for c, n in profile["missing"].items() if n > 0]
    if miss:
        add("observation", f"Missing data in: {', '.join(miss)}",
            "Missingness may bias estimates; results conditioned on observed rows.", 0.6, {"columns": miss})
    return {"profile": profile, "evidence": evidence}
