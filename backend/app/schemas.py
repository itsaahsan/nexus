from pydantic import BaseModel, Field
from typing import Any, Optional

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    description: str = Field(min_length=10, max_length=5000)
    objective: str = ""
    constraints: str = ""
    resources: str = ""
    community: str = ""
    timeframe: str = ""

class SimulateRequest(BaseModel):
    allocation_pct: float = Field(ge=0, le=100, default=65)
    coverage_pct: float = Field(ge=0, le=100, default=70)
    response_days_target: float = Field(ge=0.5, le=30, default=4.0)
    scenarios: Optional[list[dict[str, Any]]] = None

class FeedbackRequest(BaseModel):
    baseline: float
    observed: float
    note: str = ""
