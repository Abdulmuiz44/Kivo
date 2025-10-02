from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ResearchRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(index=True, unique=True)
    topic: str
    status: str = Field(default="queued")
    request_payload: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
