"use client";

import { useState, useEffect } from "react";
import { AppGrid } from "./app-grid";
import { TabBar } from "./tab-bar";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";

const STORAGE_KEY = "mobile-active-app";

export function MobileShell() {
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load last used app from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setActiveAppId(saved);
    }
    setIsHydrated(true);
  }, []);

  // Save active app to localStorage
  useEffect(() => {
    if (isHydrated && activeAppId) {
      localStorage.setItem(STORAGE_KEY, activeAppId);
    }
  }, [activeAppId, isHydrated]);

  const handleAppSelect = (appId: string) => {
    setActiveAppId(appId);
  };

  const handleTabSelect = (appId: string | null) => {
    setActiveAppId(appId);
  };

  // Show app grid if no app is selected
  if (!activeAppId) {
    return <AppGrid onAppSelect={handleAppSelect} />;
  }

  // Render the active app with tab bar
  return (
    <div className="min-h-dvh pb-20">
      {activeAppId === "notes" && <NotesApp isMobile={true} inShell={true} />}
      {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={true} />}
      <TabBar activeAppId={activeAppId} onTabSelect={handleTabSelect} />
    </div>
  );
}
