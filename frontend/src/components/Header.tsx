"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Header() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    api.health().then(() => setOnline(true)).catch(() => setOnline(false));
    const interval = setInterval(() => {
      api.health().then(() => setOnline(true)).catch(() => setOnline(false));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header">
      <h1>⚖️ Policy-as-Code Engine</h1>
      <div className="header-status">
        <span className={`status-dot ${online ? "" : "offline"}`} />
        {online ? "Engine Online" : "Engine Offline"}
      </div>
    </header>
  );
}
