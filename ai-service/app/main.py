from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import llm

app = FastAPI(title="CakAI AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm.router, prefix="/llm", tags=["LLM"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "cakai-ai-service"}
