# Medical Research Multi-Agent System

A production-style AI application that answers clinical questions by searching live medical databases. Three specialized LangGraph agents collaborate in sequence — retrieving papers, evaluating evidence quality, and synthesizing a cited, confidence-graded response.

---

## Demo

> **Query:** What is the efficacy of metformin for type 2 diabetes?

> **Response:** Metformin remains the first-line pharmacological treatment for type 2 diabetes... [Efficacy and safety of combining olorigliflozin with metformin, 2026, PubMed] ... **Confidence Level: Moderate**

---

## Architecture

```
User Question
      │
      ▼
┌─────────────────┐
│   RETRIEVER     │  Calls search_pubmed + search_arxiv tools
│   Agent         │  Embeds all papers into ChromaDB
└────────┬────────┘
         │ papers[]
         ▼
┌─────────────────┐
│  FACT-CHECKER   │  Retrieves cached context via semantic search
│  Agent          │  Assesses study types, sample sizes, contradictions
└────────┬────────┘
         │ evidence quality notes
         ▼
┌─────────────────┐
│  SYNTHESIZER    │  Composes structured answer with inline citations
│  Agent          │  Assigns confidence level: High / Moderate / Low
└─────────────────┘
         │
         ▼
  Answer + Sources + Confidence Level
```

Each agent is constrained to specific tools (principle of least privilege) and appends a reasoning step to the shared `ResearchState` — making the pipeline fully traceable via LangSmith.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent orchestration | LangGraph |
| LLM + tool calling | LangChain · OpenAI gpt-4o-mini |
| Embeddings | text-embedding-3-small |
| Vector store | ChromaDB (local persistence) |
| Literature search | PubMed (NCBI Entrez) · arXiv |
| Observability | LangSmith |
| API | FastAPI |
| Frontend | Next.js 15 · TypeScript · App Router |

---

## Project Structure

```
med-agent/
├── backend/
│   ├── agents/
│   │   └── pipeline.py        ← LangGraph state machine (3 agents)
│   ├── tools/
│   │   └── search_tools.py    ← PubMed, arXiv, ChromaDB tool definitions
│   ├── main.py                ← FastAPI app + CORS
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── app/
        ├── components/
        │   ├── Sidebar.tsx        ← Agent status + suggested queries
        │   ├── LoadingStages.tsx  ← Live agent progress tracker
        │   └── ResultMessage.tsx  ← Answer bubble + source cards
        ├── types/index.ts
        ├── page.tsx               ← Main chat interface
        ├── layout.tsx
        └── globals.css
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key — https://platform.openai.com/api-keys
- LangSmith API key (free) — https://smith.langchain.com

### Backend

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Fill in your API keys in .env

uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:3000
```

---

## Key Design Decisions

**Why LangGraph over a simple chain?**
LangGraph gives each agent its own node, tools, and system prompt. State flows explicitly between agents as a typed dict (`ResearchState`), making the pipeline easy to debug, extend, or swap individual agents without touching the others.

**Why ChromaDB?**
Papers are embedded once and cached locally. Follow-up queries on similar topics reuse the vector store instead of making redundant API calls — reducing latency and cost.

**Why separate Fact-Checker and Synthesizer agents?**
Separating evidence evaluation from response generation reduces hallucination. The Synthesizer's system prompt explicitly forbids using knowledge outside the retrieved evidence — it can only cite what the Retriever found and the Fact-Checker assessed.

**Tool isolation per agent**
- Retriever: `search_pubmed`, `search_arxiv`, `embed_and_store` (write access)
- Fact-Checker: `retrieve_context` (read only)
- Synthesizer: `retrieve_context` (read only)

This mirrors the principle of least privilege — agents cannot access tools outside their responsibility.