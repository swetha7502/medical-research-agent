"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoadingStages from "./components/LoadingStages";
import ResultMessage from "./components/ResultMessage";
import { ResearchResult } from "./types";

const SUGGESTED = [
  { label: "Diabetes", q: "What is the efficacy of metformin for type 2 diabetes?" },
  { label: "Oncology", q: "Latest immunotherapy for non-small cell lung cancer?" },
  { label: "Psychiatry", q: "Current treatments for treatment-resistant depression?" },
  { label: "Cardiology", q: "Does intermittent fasting reduce cardiovascular disease risk?" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const t1 = setTimeout(() => setActiveStage(1), 9000);
    const t2 = setTimeout(() => setActiveStage(2), 20000);

    try {
      const res = await fetch("http://localhost:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      clearTimeout(t1); clearTimeout(t2);
      if (!res.ok) {
        const err = await res.json();
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

  const isEmpty = messages.length === 0 && !loading && !error;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar onSelect={submit} disabled={loading} messageCount={messages.length} />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>

        {/* Top bar
        <div style={{
          height: 52, borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 12,
          background: "var(--panel)", flexShrink: 0,
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)" }} className="pulse" />
            <span style={{
              fontSize: "0.9rem", fontWeight: 500, color: "var(--text)",
            }}>
              Medical Research Assistant
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["LangGraph", "ChromaDB", "gpt-4o-mini"].map(t => (
              <span key={t} style={{
                fontFamily: "var(--mono)", fontSize: "0.58rem",
                padding: "3px 8px",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 4, color: "var(--text-muted)",
              }}>{t}</span>
            ))}
          </div>
        </div> */}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 8px" }}>

          {/* Empty state */}
          {isEmpty && (
            <div className="msg-in" style={{ maxWidth: 640, margin: "20px auto 0" }}>
              {/* Greeting bubble */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--teal-dim), #0d6b7a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px 14px 14px 14px",
                  padding: "18px 22px",
                  flex: 1,
                }}>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: "0.62rem",
                    color: "var(--teal)", marginBottom: 10, letterSpacing: "0.06em",
                  }}>
                    MedResearch AI
                  </div>
                  <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.6, marginBottom: 8, fontWeight: 500 }}>
                    Hello. I can help you research medical literature.
                  </p>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 16 }}>
                    Ask me any clinical question. I will search PubMed and arXiv using specialized agents and return a cited, evidence-graded answer.
                  </p>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-dim)", marginBottom: 16 }}>
                    Here are some questions you can start with:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {SUGGESTED.map(s => (
                      <button
                        key={s.q}
                        onClick={() => submit(s.q)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: "var(--surface2)",
                          border: "1px solid var(--border2)",
                          borderRadius: 8, padding: "10px 14px",
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = "var(--teal-dim)";
                          e.currentTarget.style.background = "var(--teal-glow)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = "var(--border2)";
                          e.currentTarget.style.background = "var(--surface2)";
                        }}
                      >
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: "0.58rem",
                          color: "var(--teal)", minWidth: 64,
                          letterSpacing: "0.06em",
                        }}>
                          {s.label}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.4 }}>
                          {s.q}
                        </span>
                        <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="var(--teal-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat history */}
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {/* User bubble */}
                <div className="msg-in" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <div style={{
                    maxWidth: "72%",
                    background: "var(--user-bg)",
                    border: "1px solid var(--border2)",
                    borderRadius: "14px 4px 14px 14px",
                    padding: "12px 16px",
                  }}>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: "0.6rem",
                      color: "var(--blue)", marginBottom: 5, letterSpacing: "0.06em",
                    }}>
                      You
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5 }}>
                      {msg.question}
                    </p>
                  </div>
                </div>
                <ResultMessage result={msg} />
              </div>
            ))}

            {loading && (
              <>
                {/* Show user's pending question */}
                {query === "" && (
                  <div />
                )}
                <LoadingStages activeStage={activeStage} />
              </>
            )}

            {error && (
              <div className="msg-in" style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(248,113,113,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: "4px 14px 14px 14px",
                  padding: "14px 18px", flex: 1,
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--red)", marginBottom: 5 }}>
                    Error
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-dim)", lineHeight: 1.5 }}>{error}</p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 28px 20px",
          background: "var(--panel)",
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div
              className="input-focus"
              style={{
                display: "flex",
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 12,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder="Ask a clinical question, e.g. 'What is the evidence for aspirin in primary prevention?'"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
                disabled={loading}
                style={{
                  flex: 1, background: "transparent",
                  border: "none", outline: "none",
                  color: "var(--text)", fontFamily: "var(--sans)",
                  fontSize: "0.9rem", padding: "14px 16px",
                  resize: "none", lineHeight: 1.5,
                }}
              />
              <div style={{
                display: "flex", flexDirection: "column",
                justifyContent: "center", padding: "0 12px",
                borderLeft: "1px solid var(--border2)",
              }}>
                <button
                  onClick={() => submit()}
                  disabled={loading || !query.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: loading || !query.trim() ? "var(--surface2)" : "var(--teal-dim)",
                    border: "none",
                    cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    if (!loading && query.trim()) e.currentTarget.style.background = "var(--teal)";
                  }}
                  onMouseLeave={e => {
                    if (!loading && query.trim()) e.currentTarget.style.background = "var(--teal-dim)";
                  }}
                >
                  {loading ? (
                    <div style={{
                      width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white", borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "0.6rem",
              color: "var(--text-muted)", marginTop: 7, textAlign: "center",
            }}>
              Ctrl+Enter to send · Searches PubMed + arXiv · ~30–60s per query
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
