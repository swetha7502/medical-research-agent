"use client";

import { ResearchResult, Source } from "../types";

function getConfidence(text: string): "high" | "moderate" | "low" | null {
  const m = text.match(/confidence level[:\s]*(high|moderate|low)/i);
  return m ? (m[1].toLowerCase() as "high" | "moderate" | "low") : null;
}

const CONF_CONFIG = {
  high:     { color: "#34d399", bg: "rgba(52,211,153,0.08)",  label: "High Confidence" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "Moderate Confidence" },
  low:      { color: "#f87171", bg: "rgba(248,113,113,0.08)", label: "Low Confidence" },
};

function SourceChip({ source }: { source: Source }) {
  const isPubmed = source.source === "pubmed";
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", flexDirection: "column", gap: 3,
        padding: "10px 14px",
        background: "var(--surface2)",
        border: `1px solid ${isPubmed ? "rgba(245,158,11,0.2)" : "rgba(52,211,153,0.2)"}`,
        borderRadius: 8,
        textDecoration: "none",
        transition: "all 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isPubmed ? "var(--pubmed)" : "var(--arxiv)";
        e.currentTarget.style.background = isPubmed ? "rgba(245,158,11,0.06)" : "rgba(52,211,153,0.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isPubmed ? "rgba(245,158,11,0.2)" : "rgba(52,211,153,0.2)";
        e.currentTarget.style.background = "var(--surface2)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontFamily: "var(--mono)", fontSize: "0.55rem",
          letterSpacing: "0.08em", padding: "1px 5px",
          background: isPubmed ? "rgba(245,158,11,0.12)" : "rgba(52,211,153,0.12)",
          color: isPubmed ? "var(--pubmed)" : "var(--arxiv)",
          borderRadius: 3, fontWeight: 500,
        }}>
          {isPubmed ? "PubMed" : "arXiv"}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--text-muted)" }}>
          {source.year}
        </span>
      </div>
      <span style={{
        fontSize: "0.76rem", color: "var(--text-dim)",
        lineHeight: 1.4, display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }}>
        {source.title}
      </span>
    </a>
  );
}

function parseAnswer(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      const heading = line.replace("## ", "").trim();
      // Skip the confidence level heading — we render it as a badge
      if (heading.match(/confidence level/i)) return;
      elements.push(
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          margin: "20px 0 10px",
        }}>
          <div style={{ width: 3, height: 16, background: "var(--teal)", borderRadius: 2, flexShrink: 0 }} />
          <span style={{
            fontSize: "0.78rem", fontWeight: 600,
            fontFamily: "var(--mono)", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--teal)",
          }}>
            {heading}
          </span>
        </div>
      );
      return;
    }

    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: 6 }} />);
      return;
    }

    // Numbered list items
    const numbered = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*:\s*(.*)/);
    if (numbered) {
      elements.push(
        <div key={i} style={{
          display: "flex", gap: 12, marginBottom: 10,
          padding: "10px 14px",
          background: "var(--surface2)",
          borderRadius: 8,
          border: "1px solid var(--border2)",
        }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: "0.65rem",
            color: "var(--teal)", fontWeight: 600,
            flexShrink: 0, marginTop: 2,
            minWidth: 18,
          }}>
            {numbered[1]}.
          </span>
          <div>
            <strong style={{ fontSize: "0.88rem", color: "var(--text)", fontWeight: 600 }}>
              {numbered[2]}
            </strong>
            <span style={{ fontSize: "0.88rem", color: "var(--text-dim)", lineHeight: 1.7 }}>
              : {numbered[3]}
            </span>
          </div>
        </div>
      );
      return;
    }

    // Regular paragraph — parse inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    elements.push(
      <p key={i} style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-dim)", marginBottom: 6 }}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} style={{ color: "var(--text)", fontWeight: 600 }}>{part.replace(/\*\*/g, "")}</strong>
            : part
        )}
      </p>
    );
  });

  return elements;
}

export default function ResultMessage({ result }: { result: ResearchResult }) {
  const confidence = getConfidence(result.final_answer);
  const conf = confidence ? CONF_CONFIG[confidence] : null;

  return (
    <div className="msg-in" style={{ marginBottom: 32 }}>
      {/* AI message */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--teal-dim), #0d6b7a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 2,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Agent label */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: "0.62rem",
            color: "var(--teal)", letterSpacing: "0.06em", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            MedResearch AI
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span style={{ color: "var(--text-muted)" }}>
              {result.sources.length} sources · PubMed + arXiv
            </span>
          </div>

          {/* Answer bubble */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px 14px 14px 14px",
            padding: "18px 22px",
            marginBottom: 12,
          }}>
            {parseAnswer(result.final_answer)}

            {/* Confidence badge */}
            {conf && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                marginTop: 18, padding: "6px 12px",
                background: conf.bg,
                borderRadius: 20,
                border: `1px solid ${conf.color}33`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: conf.color }} />
                <span style={{
                  fontFamily: "var(--mono)", fontSize: "0.65rem",
                  color: conf.color, fontWeight: 500,
                }}>
                  {conf.label}
                </span>
              </div>
            )}
          </div>

          {/* Sources grid */}
          {result.sources.length > 0 && (
            <div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "0.6rem",
                color: "var(--text-muted)", letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Sources ({result.sources.length})
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
              }}>
                {result.sources.map((s, i) => (
                  <SourceChip key={i} source={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
