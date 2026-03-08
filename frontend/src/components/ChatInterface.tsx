"use client";

import { useState, useRef, useEffect } from "react";
import { api, type SourceResult } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: SourceResult[];
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm the Policy-as-Code engine. Ask me about UGC, AICTE, or institutional regulations and I'll provide grounded, cited answers." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setIsLoading(true);

    try {
      const res = await api.chat(query, 3);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message || "Connection failed."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setInput("");
    }
  };

  function confidenceColor(c: number) {
    if (c >= 65) return "var(--success)";
    if (c >= 40) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>

            {msg.sources && msg.sources.length > 0 && (
              <div className="chat-citations" style={{ maxWidth: "80%" }}>
                {msg.sources.map((src, i) => (
                  <div key={i} className="citation-chip">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".25rem" }}>
                      <strong>{src.source}</strong>
                      <span style={{ fontSize: ".7rem", color: confidenceColor(src.confidence), fontWeight: 700 }}>
                        {src.confidence}%
                      </span>
                    </div>
                    <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", fontSize: ".8rem" }}>
                      {src.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="chat-bubble assistant">
            <span className="animate-pulse">Analysing regulatory corpus...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a compliance question…"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
