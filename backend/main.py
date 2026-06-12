"""
FastAPI Backend
---------------
POST /api/research  — run the full multi-agent pipeline
GET  /api/health    — health check
GET  /api/usage     — check today's query count
"""

import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

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

# ── Daily usage cap ───────────────────────────────────────────────────────────

DAILY_LIMIT = 50
USAGE_FILE  = "usage.json"

def get_usage() -> dict:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        with open(USAGE_FILE, "r") as f:
            data = json.load(f)
        if data.get("date") != today:
            return {"date": today, "count": 0}
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {"date": today, "count": 0}

def increment_usage():
    data = get_usage()
    data["count"] += 1
    with open(USAGE_FILE, "w") as f:
        json.dump(data, f)

def is_limit_reached() -> bool:
    return get_usage()["count"] >= DAILY_LIMIT

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
    usage = get_usage()
    return {
        "status": "ok",
        "agents": ["Retriever", "Fact-Checker", "Synthesizer"],
        "model": "gpt-4o-mini",
        "queries_today": usage["count"],
        "daily_limit": DAILY_LIMIT,
    }

@app.get("/api/usage")
async def usage():
    data = get_usage()
    return {
        "queries_today": data["count"],
        "daily_limit": DAILY_LIMIT,
        "remaining": max(0, DAILY_LIMIT - data["count"]),
        "date": data["date"],
    }

@app.post("/api/research", response_model=ResearchResponse)
async def research(req: ResearchRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if is_limit_reached():
        raise HTTPException(
            status_code=429,
            detail=f"This demo has reached its daily limit of {DAILY_LIMIT} queries. Please check back tomorrow."
        )

    try:
        increment_usage()
        result = await run_research(req.question)
        return ResearchResponse(
            question=result["question"],
            final_answer=result["final_answer"],
            sources=[SourceOut(**s) for s in result["sources"]],
            agent_steps=[AgentStepOut(**s) for s in result["agent_steps"]],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))