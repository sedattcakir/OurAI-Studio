import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Job:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    model: str = ""
    action: str = ""
    params: dict = field(default_factory=dict)
    status: JobStatus = JobStatus.QUEUED
    result: dict | None = None
    error: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None


_jobs: dict[str, Job] = {}
_queue: asyncio.Queue[str] = asyncio.Queue()
_worker_task: asyncio.Task | None = None
_handlers: dict[str, Any] = {}


def register_handler(model: str, handler):
    _handlers[model] = handler


async def submit_job(model: str, action: str, params: dict) -> Job:
    job = Job(model=model, action=action, params=params)
    _jobs[job.id] = job
    await _queue.put(job.id)
    return job


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)


def list_jobs(limit: int = 20) -> list[Job]:
    jobs = sorted(_jobs.values(), key=lambda j: j.created_at, reverse=True)
    return jobs[:limit]


async def _process_job(job: Job):
    handler = _handlers.get(job.model)
    if not handler:
        job.status = JobStatus.FAILED
        job.error = f"No handler for model: {job.model}"
        job.completed_at = datetime.utcnow()
        return

    job.status = JobStatus.PROCESSING
    try:
        result = await asyncio.to_thread(handler, job.action, job.params)
        job.status = JobStatus.COMPLETED
        job.result = result
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)
    finally:
        job.completed_at = datetime.utcnow()


async def _worker():
    while True:
        job_id = await _queue.get()
        job = _jobs.get(job_id)
        if job:
            await _process_job(job)
        _queue.task_done()


async def start_worker():
    global _worker_task
    _worker_task = asyncio.create_task(_worker())


async def shutdown_worker():
    global _worker_task
    if _worker_task:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
