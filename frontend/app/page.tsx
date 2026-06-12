"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoadingStages from "./components/LoadingStages";
import ResultMessage from "./components/ResultMessage";
import { ResearchResult } from "./types";

const QUICK_CARDS = [
  { label: "Diabetes", q: "What is the efficacy of metformin for type 2 diabetes?" },
  { label: "Oncology", q: "What are the latest immunotherapy approaches for non-small cell lung cancer?" },
  { label: "Psychiatry", q: "What are current treatments for treatment-resistant depression?" },
  { label: "Cardiology", q: "Does intermittent fasting reduce cardiovascular disease risk?" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(q?: string) {
    const question = (q ?? query).trim();
    if (!question || loading) return;
    setQuery("");
    setLoading(true);
    setError(null);
    setActiveStage(0);

    const t1 = setTimeout(() => setActiveStage(1), 8000);
    const t2 = setTimeout(() => setActiveStage(2), 18000);

    try {
      const res = await fetch("http://localhost:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      clearTimeout(t1); clearTimeout(t2);
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          throw new Error("⚠ Daily demo limit reached (50 queries/day). Check back tomorrow!");
        }
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data: ResearchResult = await res.json();
      setMessages(prev => [...prev, data]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setActiveStage(-1);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar onSelect={submit} disabled={loading} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          height: 46,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 14,
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)" }}>
            Research Terminal
          </span>
          <span style={{ color: "var(--border2)" }}>/</span>
          {["PubMed", "arXiv", "ChromaDB", "gpt-4o-mini", "LangGraph"].map(tag => (
            <span key={tag} style={{
              fontFamily: "var(--mono)",
              fontSize: "0.58rem",
              letterSpacing: "0.06em",
              padding: "2px 7px",
              border: "1px solid var(--border2)",
              color: "var(--dim)",
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>

          {messages.length === 0 && !loading && !error && (
            <div style={{ paddingTop: 40 }}>
              <h1 style={{
                fontFamily: "var(--serif)",
                fontSize: "2.4rem",
                color: "var(--text)",
                lineHeight: 1.2,
                marginBottom: 12,
                maxWidth: 520,
              }}>
                Query the medical<br />literature directly.
              </h1>
              <p style={{
                fontSize: "0.86rem",
                color: "var(--dim)",
                lineHeight: 1.7,
                maxWidth: 440,
                marginBottom: 36,
              }}>
                Three specialized agents search PubMed and arXiv, evaluate evidence quality,
                and synthesize a cited answer graded by confidence level.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 560 }}>
                {QUICK_CARDS.map(card => (
                  <button
                    key={card.q}
                    onClick={() => submit(card.q)}
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      padding: "14px 16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.background = "rgba(200,169,110,0.03)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.58rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      display: "block",
                      marginBottom: 5,
                    }}>
                      {card.label}
                    </span>
                    <p style={{ fontSize: "0.78rem", color: "var(--mid)", lineHeight: 1.4 }}>{card.q}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ResultMessage key={i} result={msg} />
          ))}

          {loading && <LoadingStages activeStage={activeStage} />}

          {error && (
            <div style={{
              borderLeft: "2px solid var(--red)",
              padding: "10px 16px",
              marginBottom: 24,
              background: "rgba(185,64,64,0.05)",
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)", marginBottom: 4 }}>
                Error
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--mid)" }}>{error}</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 28px 18px", background: "var(--bg)", flexShrink: 0 }}>
          <div style={{ display: "flex", border: "1px solid var(--border2)" }}>
            <span style={{
              fontFamily: "var(--mono)",
              fontSize: "0.75rem",
              color: "var(--accent)",
              padding: "12px 14px",
              background: "var(--surface)",
              borderRight: "1px solid var(--border2)",
              display: "flex",
              alignItems: "center",
              userSelect: "none",
              flexShrink: 0,
            }}>
              &gt;_
            </span>
            <textarea
              rows={2}
              placeholder="Enter a clinical question..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
              disabled={loading}
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "var(--mono)",
                fontSize: "0.78rem",
                padding: "12px 14px",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => submit()}
              disabled={loading || !query.trim()}
              style={{
                background: loading || !query.trim() ? "var(--border2)" : "var(--accent)",
                border: "none",
                color: loading || !query.trim() ? "var(--dim)" : "#0a0a0a",
                fontFamily: "var(--mono)",
                fontSize: "0.66rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0 20px",
                cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {loading ? "..." : "Submit"}
            </button>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--dim)", marginTop: 7 }}>
            Ctrl+Enter to submit · ~30–60s per query
          </div>
        </div>
      </div>
    </div>
  );
}