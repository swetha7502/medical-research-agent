"""
LangGraph Multi-Agent Pipeline
================================
State flows through 3 agents in sequence:

  [Question]
      │
      ▼
  RETRIEVER     → searches PubMed + arXiv, embeds into ChromaDB
      │
      ▼
  FACT-CHECKER  → evaluates evidence quality, flags contradictions
      │
      ▼
  SYNTHESIZER   → produces final cited answer
      │
      ▼
  [Answer + Sources + Agent Trace]

Each agent appends an AgentStep to state["agent_steps"] so the
frontend can show the full reasoning trace.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from typing import TypedDict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, END

from tools.search_tools import search_pubmed, search_arxiv, embed_and_store, retrieve_context

# ── State schema ──────────────────────────────────────────────────────────────

class AgentStep(TypedDict):
    agent: str
    thought: str
    action: str
    result: str


class ResearchState(TypedDict):
    question: str
    papers: list[dict]
    fact_check_notes: str
    final_answer: str
    sources: list[dict]
    agent_steps: list[AgentStep]


# ── LLM setup ─────────────────────────────────────────────────────────────────

from langchain_openai import ChatOpenAI
_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

_retriever_llm   = _llm.bind_tools([search_pubmed, search_arxiv, embed_and_store])
_factcheck_llm   = _llm.bind_tools([retrieve_context])
_synthesizer_llm = _llm.bind_tools([retrieve_context])

_all_tools = {
    "search_pubmed":    search_pubmed,
    "search_arxiv":     search_arxiv,
    "embed_and_store":  embed_and_store,
    "retrieve_context": retrieve_context,
}


def _run_tool(tool_call: dict) -> str:
    """Execute a tool call and return stringified result."""
    fn = _all_tools.get(tool_call["name"])
    if fn is None:
        return f"Unknown tool: {tool_call['name']}"
    result = fn.invoke(tool_call["args"])
    return str(result)


def _agent_loop(llm, messages: list) -> tuple[str, list]:
    """Run an LLM+tools loop until the model stops calling tools.
    Returns (final_text, tool_call_names_used)."""
    tools_used = []
    response = llm.invoke(messages)
    messages = messages + [response]

    while response.tool_calls:
        for tc in response.tool_calls:
            tools_used.append(tc["name"])
            result = _run_tool(tc)
            messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))
        response = llm.invoke(messages)
        messages = messages + [response]

    return response.content, tools_used


# ── Agent 1: Retriever ────────────────────────────────────────────────────────

def retriever_node(state: ResearchState) -> dict:
    system = """You are a medical literature retrieval specialist.
Given a clinical question, your job is to find relevant papers.

Steps you MUST follow:
1. Call search_pubmed with a focused clinical query (use medical terminology)
2. Call search_arxiv with a related biomedical/AI-health query
3. Collect ALL papers returned from both calls
4. Call embed_and_store with the combined list of papers

Retrieve up to 5 papers from each source. Be thorough."""

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=f"Research question: {state['question']}"),
    ]

    # Run the tool loop manually so we can collect papers
    papers_collected: list[dict] = []
    response = _retriever_llm.invoke(messages)
    messages.append(response)

    while response.tool_calls:
        for tc in response.tool_calls:
            result_raw = _all_tools[tc["name"]].invoke(tc["args"])
            if tc["name"] in ("search_pubmed", "search_arxiv"):
                if isinstance(result_raw, list):
                    papers_collected.extend(result_raw)
            messages.append(ToolMessage(content=str(result_raw), tool_call_id=tc["id"]))
        response = _retriever_llm.invoke(messages)
        messages.append(response)

    steps = list(state.get("agent_steps", []))
    steps.append(AgentStep(
        agent="Retriever",
        thought="Searching PubMed and arXiv for peer-reviewed and preprint evidence",
        action=f"Called search_pubmed + search_arxiv + embed_and_store",
        result=f"Retrieved {len(papers_collected)} papers: "
               + str([p.get("title", "?")[:55] for p in papers_collected[:4]]),
    ))

    return {"papers": papers_collected, "agent_steps": steps}


# ── Agent 2: Fact-Checker ─────────────────────────────────────────────────────

def fact_checker_node(state: ResearchState) -> dict:
    papers_summary = "\n".join(
        f"- [{p.get('source','?').upper()}] {p.get('title','?')[:80]} ({p.get('year','?')})"
        for p in state["papers"][:8]
        if "error" not in p
    )

    system = """You are a medical evidence quality analyst.
Your job: critically evaluate the retrieved evidence.

For each paper consider:
- Study type (RCT, meta-analysis, systematic review, observational, preprint)
- Sample size (if mentioned in title/abstract)
- Publication year (recency)
- Whether findings agree or conflict with other papers

Produce a structured evidence quality report with:
1. Summary of evidence strength (High / Moderate / Low / Insufficient)
2. Key findings across papers
3. Any contradictions or conflicts between papers
4. Caveats the synthesizer must mention

Use retrieve_context to pull full abstracts if needed."""

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=(
            f"Question: {state['question']}\n\n"
            f"Retrieved papers ({len(state['papers'])}):\n{papers_summary}"
        )),
    ]

    notes, tools_used = _agent_loop(_factcheck_llm, messages)

    steps = list(state.get("agent_steps", []))
    steps.append(AgentStep(
        agent="Fact-Checker",
        thought="Evaluating study types, recency, sample sizes, and contradictions",
        action=f"Assessed {len(state['papers'])} papers" +
               (f" + called {', '.join(set(tools_used))}" if tools_used else ""),
        result=notes[:400] + ("..." if len(notes) > 400 else ""),
    ))

    return {"fact_check_notes": notes, "agent_steps": steps}


# ── Agent 3: Synthesizer ──────────────────────────────────────────────────────

def synthesizer_node(state: ResearchState) -> dict:
    papers_list = "\n".join(
        f"- [{p.get('source','?').upper()}] {p.get('title','?')} ({p.get('year','?')}) — {p.get('url','')}"
        for p in state["papers"][:8]
        if "error" not in p
    )

    system = """You are a medical research synthesizer.
Write a clear, well-structured answer to the clinical question.

STRICT RULES:
- Use ONLY the evidence from the retrieved papers — no outside knowledge
- Cite every claim: [Author/Title keyword, YEAR, SOURCE]
- Structure your answer as:
    ## Summary
    (2-3 sentence direct answer)

    ## Evidence
    (what the papers say, with inline citations)

    ## Limitations & Caveats
    (gaps in evidence, study limitations, contradictions)

    ## Confidence Level
    High / Moderate / Low — with one-sentence justification

If evidence is insufficient, say so clearly."""

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=(
            f"Question: {state['question']}\n\n"
            f"Evidence quality assessment:\n{state['fact_check_notes']}\n\n"
            f"Papers available:\n{papers_list}"
        )),
    ]

    answer, tools_used = _agent_loop(_synthesizer_llm, messages)

    # Build clean sources list
    sources = [
        {
            "title": p.get("title", "Unknown"),
            "source": p.get("source", ""),
            "year": p.get("year", ""),
            "url": p.get("url", ""),
        }
        for p in state["papers"][:8]
        if "error" not in p
    ]

    steps = list(state.get("agent_steps", []))
    steps.append(AgentStep(
        agent="Synthesizer",
        thought="Composing final cited answer using only retrieved evidence",
        action="Generated structured answer with citations and confidence level",
        result=answer[:400] + ("..." if len(answer) > 400 else ""),
    ))

    return {"final_answer": answer, "sources": sources, "agent_steps": steps}


# ── Build graph ───────────────────────────────────────────────────────────────

def _build_graph():
    g = StateGraph(ResearchState)
    g.add_node("retriever",    retriever_node)
    g.add_node("fact_checker", fact_checker_node)
    g.add_node("synthesizer",  synthesizer_node)
    g.set_entry_point("retriever")
    g.add_edge("retriever",    "fact_checker")
    g.add_edge("fact_checker", "synthesizer")
    g.add_edge("synthesizer",  END)
    return g.compile()


_graph = _build_graph()


# ── Public function ───────────────────────────────────────────────────────────

async def run_research(question: str) -> ResearchState:
    """Run the full 3-agent pipeline. Returns completed ResearchState."""
    initial: ResearchState = {
        "question": question,
        "papers": [],
        "fact_check_notes": "",
        "final_answer": "",
        "sources": [],
        "agent_steps": [],
    }
    return await _graph.ainvoke(initial)
