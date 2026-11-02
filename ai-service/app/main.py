from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import llm, jobs
from app.orchestrator.queue import start_worker, shutdown_worker, register_handler
from app.orchestrator.handlers.llm_handler import llm_handle
from app.orchestrator.handlers.image_handler import image_handle
from app.orchestrator.handlers.voice_handler import voice_handle
from app.orchestrator.handlers.speech_handler import speech_handle
from app.orchestrator.handlers.video_handler import video_handle


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_handler("ourllm", llm_handle)
    register_handler("ourimage", image_handle)
    register_handler("ourvoice", voice_handle)
    register_handler("ourspeech", speech_handle)
    register_handler("ourvideo", video_handle)
    await start_worker()
    yield
    await shutdown_worker()


app = FastAPI(title="CakAI AI Service", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm.router, prefix="/llm", tags=["LLM"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "cakai-ai-service", "version": "0.2.0"}
