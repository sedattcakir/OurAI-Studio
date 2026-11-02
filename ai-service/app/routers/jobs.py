from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.orchestrator.queue import submit_job, get_job, list_jobs

router = APIRouter()


class JobSubmitRequest(BaseModel):
    model: str
    action: str = "generate"
    params: dict = {}


class JobResponse(BaseModel):
    id: str
    model: str
    action: str
    status: str
    result: dict | None = None
    error: str | None = None
    created_at: str
    completed_at: str | None = None


def _job_to_response(job) -> JobResponse:
    return JobResponse(
        id=job.id,
        model=job.model,
        action=job.action,
        status=job.status.value,
        result=job.result,
        error=job.error,
        created_at=job.created_at.isoformat(),
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
    )


@router.post("/submit", response_model=JobResponse)
async def submit(req: JobSubmitRequest):
    job = await submit_job(model=req.model, action=req.action, params=req.params)
    return _job_to_response(job)


@router.get("/{job_id}", response_model=JobResponse)
async def status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_response(job)


@router.get("/", response_model=list[JobResponse])
async def recent_jobs(limit: int = 20):
    return [_job_to_response(j) for j in list_jobs(limit)]
