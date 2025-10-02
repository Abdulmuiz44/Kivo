from fastapi import APIRouter, HTTPException, status

from ...schemas.research import ResearchRequest
from ...services.research_runner import ResearchRunner


router = APIRouter()
runner = ResearchRunner()


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
def start_research(request: ResearchRequest) -> dict:
    run_id = runner.start_run(request)
    return {"run_id": run_id, "status": "queued"}


@router.get("/{run_id}/status")
def get_research_status(run_id: str):
    status_payload = runner.get_status(run_id)
    if not status_payload:
        raise HTTPException(status_code=404, detail="Run not found")
    return status_payload


@router.get("/{run_id}/summary")
def get_research_summary(run_id: str):
    summary = runner.get_summary(run_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not available")
    return summary


@router.get("/{run_id}/json")
def get_research_payload(run_id: str):
    payload = runner.get_payload(run_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Payload not available")
    return payload
