"use client";

import { SourceResult, ChatResponse } from "@/lib/api";

type ResultState = "idle" | "loading" | "error" | "results";

type Props = {
  state: ResultState;
  data: ChatResponse | null;
  error: string | null;
};

function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export default function ResultsDisplay({ state, data, error }: Props) {
  if (state === "idle") {
    return (
      <div className="state-idle slide-up">
        <div className="icon">🔎</div>
        <div>
          <strong>Ask anything about academic regulations</strong>
          <p style={{ marginTop: ".5rem", fontSize: ".88rem" }}>
            Search UGC, AICTE, and institutional policy documents using
            natural language queries.
          </p>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="state-loading fade-in">
        <div className="spinner" />
        <div>Searching knowledge base and generating answer...</div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="state-error fade-in">
        <div className="icon">⚠️</div>
        <div>
          <strong>Something went wrong</strong>
          <p style={{ marginTop: ".25rem", fontSize: ".88rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="slide-up">
      {/* Answer */}
      <div className="glass-panel" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <span className="icon">🤖</span> Generated Answer
        </div>
        <div style={{ fontSize: ".9rem", lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
          {data.answer}
        </div>
      </div>

      {/* Source cards */}
      {data.sources.length > 0 && (
        <>
          <div className="section-title">
            <span className="icon">📎</span> Retrieved Sources ({data.sources.length})
          </div>
          <div className="results-container">
            {data.sources.map((src, i) => {
              const level = confidenceLevel(src.confidence);
              return (
                <div key={i} className={`result-card confidence-${level}`}>
                  <div className="result-card-header">
                    <span className="result-source">📄 {src.source}</span>
                    <span className={`confidence-badge ${level}`}>
                      {src.confidence}% match
                    </span>
                  </div>
                  <div className="result-content">{src.content}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
