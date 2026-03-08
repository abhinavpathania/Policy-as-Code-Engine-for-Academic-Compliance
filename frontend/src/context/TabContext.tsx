"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TabId = "search" | "documents" | "chat";

type TabInfo = {
  id: TabId;
  label: string;
  icon: string;
};

export const TAB_LIST: TabInfo[] = [
  { id: "search",    label: "Search",   icon: "🔍" },
  { id: "documents", label: "Documents", icon: "📁" },
  { id: "chat",      label: "Chat",      icon: "💬" },
];

type TabContextType = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabs: TabInfo[];
};

const TabContext = createContext<TabContextType | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("search");

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, tabs: TAB_LIST }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTab must be used within a TabProvider");
  return ctx;
}
