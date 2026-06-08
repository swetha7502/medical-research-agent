# Medical Research Multi-Agent System

Ask a clinical question → 3 LangGraph agents search PubMed + arXiv → cited, evidence-graded answer.

---

## Architecture

```
[Question]
    │
    ▼
┌──────────────┐
│  RETRIEVER   │  search_pubmed + search_arxiv + embed_and_store
└──────┬───────┘
       │ papers[]
       ▼
┌──────────────┐
│ FACT-CHECKER │  retrieve_context → evidence quality report
└──────┬───────┘
       │ fact_check_notes
       ▼
┌──────────────┐
│ SYNTHESIZER  │  retrieve_context → structured cited answer
└──────────────┘
       │
       ▼
Answer + Sources + Agent Trace (shown in UI)
```

## Stack

| Layer | Technology |
|---|---|
| Agent orchestration | LangGraph |
| LLM + tools | LangChain + OpenAI gpt-4o-mini |
| Vector store | ChromaDB (local) |
| Embeddings | text-embedding-3-small |
| Live search | PubMed (NCBI Entrez) + arXiv |
| Observability | LangSmith |
| API | FastAPI |
| Frontend | React + Vite |

---

## Setup (Windows)

### Step 1 — Get API keys

**OpenAI** (required)
- https://platform.openai.com/api-keys → create key → copy it

**LangSmith** (free, strongly recommended)
- https://smith.langchain.com → sign up → Settings → Create API key → copy it

### Step 2 — Backend

```cmd
cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

copy .env.example .env
```

Open `.env` and fill in:
```
OPENAI_API_KEY=sk-...
LANGCHAIN_API_KEY=ls-...
NCBI_EMAIL=your@email.com
```

Then start the server:
```cmd
uvicorn main:app --reload
```

Test it works: open http://localhost:8000/docs → try POST /api/research

### Step 3 — Frontend

Open a second terminal:
```cmd
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## File structure

```
med-agent/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   └── pipeline.py        ← LangGraph state machine (3 agents)
│   ├── tools/
│   │   ├── __init__.py
│   │   └── search_tools.py    ← PubMed + arXiv + ChromaDB tools
│   ├── main.py                ← FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AgentTrace.jsx  ← collapsible agent reasoning UI
    │   │   └── SourceCard.jsx  ← paper source card
    │   ├── App.jsx
    │   └── App.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Interview talking points

1. **LangGraph state machine** — `ResearchState` is a typed dict that flows through nodes; each node returns a partial update. Draw the graph on a whiteboard.
2. **Tool-binding per agent** — Retriever has write tools, Fact-Checker and Synthesizer have read-only tools. This is "principle of least privilege" applied to agents.
3. **ChromaDB as a cache** — papers are embedded once and semantically retrieved; avoids re-calling APIs for follow-up questions.
4. **LangSmith observability** — every LLM call, tool input/output, and latency is visible in the trace dashboard. Show this during the demo.
5. **Evidence-constrained output** — the Synthesizer's system prompt explicitly forbids using outside knowledge. This is how you prevent hallucination in RAG systems.
