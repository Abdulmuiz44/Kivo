from datetime import date, datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ResearchDepth(str, Enum):
    default = "default"
    deep = "deep"


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Primary topic to research")
    from_date: Optional[date] = Field(None, description="Start date for search window")
    to_date: Optional[date] = Field(None, description="End date for search window")
    depth: ResearchDepth = ResearchDepth.default
    sources: List[Literal["reddit", "x"]] = Field(default_factory=lambda: ["reddit", "x"])
    sample_limit: Optional[int] = Field(None, ge=1, le=1000)


class ResearchRunStatus(BaseModel):
    run_id: str
    status: Literal["queued", "running", "completed", "failed"]
    progress: float = Field(ge=0.0, le=1.0, default=0.0)
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class ResearchSummary(BaseModel):
    run_id: str
    topic: str
    created_at: datetime
    summary_text: str
    top_pain_points: List[str] = Field(default_factory=list)
    product_hypotheses: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    top_sources: List[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "low"


class ResearchJSONPayload(BaseModel):
    payload: dict
