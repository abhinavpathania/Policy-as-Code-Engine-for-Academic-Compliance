"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ResultsDisplay from "@/components/ResultsDisplay";
import DocumentManager from "@/components/DocumentManager";
import ChatInterface from "@/components/ChatInterface";
import { useTab } from "@/context/TabContext";
import { api, type ChatResponse } from "@/lib/api";
import { useState } from "react";

export default function Home() {
  const { activeTab } = useTab();

  // Search state
  const [query, setQuery] = useState("");
  const [resultState, setResultState] = useState<"idle" | "loading" | "error" | "results">("idle");
  const [resultData, setResultData] = useState<ChatResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setResultState("loading");
    setResultError(null);
    try {
      const data = await api.chat(query, 3);
      setResultData(data);
      setResultState("results");
    } catch (err: any) {
      setResultError(err.message || "Unknown error");
      setResultState("error");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <Header />

      <main className="main-content">
        {activeTab === "search" && (
          <div className="slide-up">
            <div style={{ marginBottom: "1.5rem" }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                isLoading={resultState === "loading"}
              />
            </div>
            <ResultsDisplay
              state={resultState}
              data={resultData}
              error={resultError}
            />
          </div>
        )}

        {activeTab === "documents" && <DocumentManager />}

        {activeTab === "chat" && <ChatInterface />}
      </main>
    </div>
  );
}
