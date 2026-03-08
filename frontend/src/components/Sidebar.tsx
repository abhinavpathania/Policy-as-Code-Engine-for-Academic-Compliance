"use client";

import { useTab, TAB_LIST } from "@/context/TabContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Sidebar() {
  const { activeTab, setActiveTab } = useTab();
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    api.getStats()
      .then((s) => setDocCount(s.total_documents))
      .catch(() => {});
  }, [activeTab]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="icon">⚖️</span>
        <span>PaC Engine</span>
      </div>

      <nav className="sidebar-nav">
        {TAB_LIST.map((tab) => (
          <div
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === "documents" && docCount > 0 && (
              <span className="badge">{docCount}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        Qwen 2.5 · nomic-embed · ChromaDB
      </div>
    </aside>
  );
}
