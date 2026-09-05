"""LLM provider abstraction with deterministic demo fallback. Never hard-code keys."""
import os

class AIProvider:
    name = "demo"
    def enrich(self, parsed: dict, evidence_summary: str) -> dict:
        raise NotImplementedError

class DemoProvider(AIProvider):
    name = "demo"
    def enrich(self, parsed, evidence_summary):
        return {"narrative": "Deterministic demo synthesis (no external LLM). " + evidence_summary[:400],
                "provider": "demo", "model": "local-deterministic-v1"}

class GenericProvider(AIProvider):
    name = "generic"
    def enrich(self, parsed, evidence_summary):
        # Placeholder for env-configured LLM; falls back safely offline.
        url = os.getenv("GENERIC_LLM_URL", "")
        if not url:
            return DemoProvider().enrich(parsed, evidence_summary)
        return {"narrative": "Generic provider configured; offline fallback used for reproducibility.",
                "provider": "generic"}

def get_provider() -> AIProvider:
    p = os.getenv("LLM_PROVIDER", "demo").lower()
    if p in ("demo", "", "local"):
        return DemoProvider()
    return GenericProvider()
