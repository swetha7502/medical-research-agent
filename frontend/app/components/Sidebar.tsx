"use client";

const EXAMPLES = [
  { label: "Diabetes", q: "What is the efficacy of metformin for type 2 diabetes?" },
  { label: "Oncology", q: "Latest immunotherapy approaches for non-small cell lung cancer?" },
  { label: "Psychiatry", q: "Current treatments for treatment-resistant depression?" },
  { label: "Cardiology", q: "Does intermittent fasting reduce cardiovascular disease risk?" },
  { label: "Neurology", q: "Does exercise reduce Alzheimer's disease risk?" },
  { label: "Infectious", q: "Current evidence on long COVID cognitive symptoms?" },
];

interface SidebarProps {
  onSelect: (q: string) => void;
  disabled: boolean;
  messageCount: number;
}

export default function Sidebar({ onSelect, disabled, messageCount }: SidebarProps) {
  return (
    <aside style={{
      width: 272,
      flexShrink: 0,
      background: "var(--panel)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>

      {/* Brand header */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {/* Pixel bot + intro */}
        <div>
          <svg width="56" height="56" viewBox="0 0 16 16" style={{ imageRendering: "pixelated", display: "block", marginBottom: 10 }}>
            <rect x="3" y="1" width="10" height="8" fill="#1a7a72" />
            <rect x="5" y="3" width="2" height="2" fill="#2dd4bf" />
            <rect x="9" y="3" width="2" height="2" fill="#2dd4bf" />
            <rect x="5" y="6" width="1" height="1" fill="#2dd4bf" />
            <rect x="6" y="7" width="4" height="1" fill="#2dd4bf" />
            <rect x="10" y="6" width="1" height="1" fill="#2dd4bf" />
            <rect x="7" y="0" width="2" height="1" fill="#2dd4bf" />
            <rect x="7" y="9" width="2" height="1" fill="#1a7a72" />
            <rect x="4" y="10" width="8" height="5" fill="#1a7a72" />
            <rect x="7" y="11" width="2" height="2" fill="#2dd4bf" />
            <rect x="2" y="10" width="2" height="4" fill="#1a7a72" />
            <rect x="12" y="10" width="2" height="4" fill="#1a7a72" />
          </svg>
          <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2, marginBottom: 4 }}>
            Hi, I'm Medi.
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
            I'm here to help you find medical evidence.
          </div>
        </div>

        {/* Agent status pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
          {[
            { name: "Retriever", desc: "PubMed · arXiv" },
            { name: "Fact-Checker", desc: "Evidence QA" },
            { name: "Synthesizer", desc: "Response Gen" },
          ].map(agent => (
            <div key={agent.name} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg)", borderRadius: 6,
              padding: "5px 10px",
            }}>
              <div className="pulse" style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--teal)", flexShrink: 0,
              }} />
              <span style={{ fontSize: "0.72rem", color: "var(--text)", fontWeight: 500 }}>
                {agent.name}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                {agent.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested queries */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px" }}>
        <div style={{
          fontSize: "0.65rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--text-muted)", padding: "0 8px", marginBottom: 8,
          fontWeight: 600,
        }}>
          Suggested
        </div>
        {EXAMPLES.map(ex => (
          <button
            key={ex.q}
            disabled={disabled}
            onClick={() => onSelect(ex.q)}
            style={{
              display: "flex", flexDirection: "column", gap: 2,
              width: "100%", background: "none",
              border: "1px solid transparent",
              borderRadius: 8,
              padding: "9px 10px",
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              marginBottom: 2,
              opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!disabled) {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border2)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <span style={{
              fontSize: "0.62rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--teal)", fontWeight: 600,
            }}>
              {ex.label}
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.4 }}>
              {ex.q}
            </span>
          </button>
        ))}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: "12px 20px", borderTop: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {messageCount} {messageCount === 1 ? "query" : "queries"} this session
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--teal)", fontWeight: 500 }}>
            gpt-4o-mini
          </div>
        </div>
      </div>
    </aside>
  );
}