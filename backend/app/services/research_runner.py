from __future__ import annotations

import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Callable, Dict, Optional, Sequence
from uuid import uuid4

from ..core.config import get_settings
from ..schemas.research import (
    ResearchJSONPayload,
    ResearchRequest,
    ResearchRunStatus,
    ResearchSummary,
)
from ..pipelines import fallback_pipeline


PipelineFn = Callable[[str, ResearchRequest, Optional[Sequence[Dict[str, object]]]], tuple]


class ResearchRunner:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._runs: Dict[str, Dict[str, object]] = {}
        self._lock = threading.Lock()
        Path(self._settings.storage_path).mkdir(parents=True, exist_ok=True)
        self._pipeline_mode = "lite"
        self._pipeline_func: PipelineFn = self._select_pipeline()

    def start_run(self, request: ResearchRequest) -> str:
        run_id = str(uuid4())
        now = datetime.utcnow()
        with self._lock:
            self._runs[run_id] = {
                "request": request,
                "status": "queued",
                "progress": 0.0,
                "message": None,
                "created_at": now,
                "started_at": None,
                "finished_at": None,
                "summary": None,
                "payload": None,
                "pipeline_mode": self._pipeline_mode,
            }

        worker = threading.Thread(target=self._execute_run, args=(run_id,), daemon=True)
        worker.start()
        return run_id

    def get_status(self, run_id: str) -> Optional[ResearchRunStatus]:
        run = self._runs.get(run_id)
        if not run:
            return None
        return ResearchRunStatus(
            run_id=run_id,
            status=run["status"],
            progress=run["progress"],
            message=run["message"],
            started_at=run["started_at"],
            finished_at=run["finished_at"],
        )

    def get_summary(self, run_id: str) -> Optional[ResearchSummary]:
        run = self._runs.get(run_id)
        if not run or run.get("summary") is None:
            return None
        return run["summary"]

    def get_payload(self, run_id: str) -> Optional[ResearchJSONPayload]:
        run = self._runs.get(run_id)
        if not run or run.get("payload") is None:
            return None
        return ResearchJSONPayload(payload=run["payload"])

    def _execute_run(self, run_id: str) -> None:
        with self._lock:
            run = self._runs[run_id]
            run["status"] = "running"
            run["started_at"] = datetime.utcnow()

        try:
            for step in range(1, 4):
                time.sleep(0.5)
                with self._lock:
                    self._runs[run_id]["progress"] = step / 3

            request: ResearchRequest = self._runs[run_id]["request"]
            raw_items: Sequence[Dict[str, object]] = []
            payload, summary = self._pipeline_func(run_id, request, raw_items)
            payload.setdefault("pipeline_mode", self._pipeline_mode)

            with self._lock:
                self._runs[run_id]["status"] = "completed"
                self._runs[run_id]["finished_at"] = datetime.utcnow()
                self._runs[run_id]["summary"] = summary
                self._runs[run_id]["payload"] = payload
        except Exception as exc:  # pragma: no cover - best effort logging placeholder
            with self._lock:
                self._runs[run_id]["status"] = "failed"
                self._runs[run_id]["finished_at"] = datetime.utcnow()
                self._runs[run_id]["message"] = str(exc)

    def _select_pipeline(self) -> PipelineFn:
        try:
            import numpy  # noqa: F401

            from ..pipelines import full_pipeline

            self._pipeline_mode = "full"
            return full_pipeline.run_pipeline  # type: ignore[attr-defined]
        except Exception:
            self._pipeline_mode = "lite"
            return fallback_pipeline.run_pipeline
