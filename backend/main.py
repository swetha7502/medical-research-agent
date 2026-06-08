"""
FastAPI Backend
---------------
POST /api/research  — run the full multi-agent pipeline
GET  /api/health    — health check
GET  /docs          — Swagger UI (test here before touching the frontend)
"""

import os
from dotenv import load_dotenv

load_dotenv()  # loads .env from the same directory

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.pipeline import run_research

app = FastAPI(
    title="Medical Research Multi-Agent System",
    description="3 LangGraph agents: Retriever → Fact-Checker → Synthesizer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ─────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    question: str


class AgentStepOut(BaseModel):
    agent: str
    thought: str
    action: str
    result: str


class SourceOut(BaseModel):
    title: str
    source: str
    year: str
    url: str


class ResearchResponse(BaseModel):
    question: str
    final_answer: str
    sources: list[SourceOut]
    agent_steps: list[AgentStepOut]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "agents": ["Retriever", "Fact-Checker", "Synthesizer"],
        "model": "gpt-4o-mini",
    }


@app.post("/api/research", response_model=ResearchResponse)
async def research(req: ResearchRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    try:
        result = await run_research(req.question)
        return ResearchResponse(
            question=result["question"],
            final_answer=result["final_answer"],
            sources=[SourceOut(**s) for s in result["sources"]],
            agent_steps=[AgentStepOut(**s) for s in result["agent_steps"]],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
