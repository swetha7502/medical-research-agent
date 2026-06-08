"use client";

const STAGES = [
  { name: "Retriever Agent", desc: "Searching PubMed and arXiv for relevant literature..." },
  { name: "Fact-Checker Agent", desc: "Evaluating evidence quality and identifying contradictions..." },
  { name: "Synthesizer Agent", desc: "Composing evidence-graded response with citations..." },
];

export default function LoadingStages({ activeStage }: { activeStage: number }) {
  return (
    <div className="msg-in" style={{ display: "flex", gap: 12, marginBottom: 28, alignItems: "flex-start" }}>
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

      <div style={{ flex: 1 }}>
        {/* Label */}
        <div style={{
          fontFamily: "var(--mono)", fontSize: "0.62rem",
          color: "var(--teal)", letterSpacing: "0.06em",
          marginBottom: 10,
        }}>
          MedResearch AI  ·  <span style={{ color: "var(--text-muted)" }}>processing</span>
        </div>

        {/* Stage cards */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {STAGES.map((stage, i) => {
            const isDone    = activeStage > i;
            const isRunning = activeStage === i;
            const isPending = activeStage < i;

            return (
              <div
                key={i}
                className="stage-reveal"
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  borderBottom: i < STAGES.length - 1 ? "1px solid var(--border)" : "none",
                  background: isRunning ? "var(--teal-glow)" : "transparent",
                  animationDelay: `${i * 0.1}s`,
                  transition: "background 0.3s",
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "rgba(45,212,191,0.12)" : isRunning ? "rgba(45,212,191,0.08)" : "var(--surface2)",
                  border: `1px solid ${isDone ? "var(--teal)" : isRunning ? "var(--teal-dim)" : "var(--border2)"}`,
                  transition: "all 0.3s",
                }}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isRunning ? (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)" }} className="pulse" />
                  ) : (
                    <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>{i + 1}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "0.88rem", fontWeight: 500,
                    color: isPending ? "var(--text-muted)" : "var(--text)",
                    marginBottom: 2,
                    transition: "color 0.3s",
                  }}>
                    {stage.name}
                  </div>
                  <div style={{
                    fontSize: "0.76rem",
                    color: isRunning ? "var(--text-dim)" : "var(--text-muted)",
                    transition: "color 0.3s",
                  }}>
                    {stage.desc}
                  </div>
                </div>

                <div style={{
                  fontFamily: "var(--mono)", fontSize: "0.6rem",
                  color: isDone ? "var(--teal)" : isRunning ? "var(--teal)" : "var(--text-muted)",
                  fontWeight: isDone || isRunning ? 500 : 400,
                }}>
                  {isDone ? "done" : isRunning ? "running" : "queued"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, paddingLeft: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className={`dot${i + 1}`} style={{
              width: 5, height: 5, borderRadius: "50%", background: "var(--teal-dim)",
            }} />
          ))}
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--text-muted)", marginLeft: 6 }}>
            ~30–60 seconds
          </span>
        </div>
      </div>
    </div>
  );
}
