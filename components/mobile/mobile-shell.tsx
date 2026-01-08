"use client";

import { useState, useEffect } from "react";
import { TabBar } from "./tab-bar";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";

const STORAGE_KEY = "mobile-active-app";
const DEFAULT_APP = "notes";

interface MobileShellProps {
  initialApp?: string; // App to show on load (overrides localStorage)
  initialNoteSlug?: string; // For notes app: which note to select
}

export function MobileShell({ initialApp, initialNoteSlug }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(DEFAULT_APP);
  const [isHydrated, setIsHydrated] = useState(false);

  // Determine active app from URL, initialApp prop, or localStorage
  useEffect(() => {
    // First check URL to ensure sync across resize
    const path = window.location.pathname;
    let appFromUrl: string | null = null;
    if (path.startsWith("/settings")) {
      appFromUrl = "settings";
    } else if (path.startsWith("/messages")) {
      appFromUrl = "messages";
    } else if (path.startsWith("/notes")) {
      appFromUrl = "notes";
    }

    if (appFromUrl) {
      setActiveAppId(appFromUrl);
    } else if (initialApp) {
      setActiveAppId(initialApp);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === "notes" || saved === "messages" || saved === "settings")) {
        setActiveAppId(saved);
      }
    }
    setIsHydrated(true);
  }, [initialApp]);

  // Save active app to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, activeAppId);
    }
  }, [activeAppId, isHydrated]);

  const handleTabSelect = (appId: string | null) => {
    if (appId) {
      setActiveAppId(appId);
      // Update URL when switching apps
      if (appId === "messages") {
        window.history.replaceState(null, "", "/messages");
      } else if (appId === "notes") {
        // Go to /notes (sidebar view) when switching to notes
        window.history.replaceState(null, "", "/notes");
      } else if (appId === "settings") {
        window.history.replaceState(null, "", "/settings");
      }
    }
  };

  // Don't render until hydrated to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-dvh bg-background">
        {/* Placeholder with same background as apps to prevent flash */}
      </div>
    );
  }

  // Render the active app with tab bar
  return (
    <div className="h-dvh flex flex-col bg-background">
      <div className="flex-1 min-h-0">
        {activeAppId === "notes" && (
          <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} />
        )}
        {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={false} />}
        {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
      </div>
      <TabBar activeAppId={activeAppId} onTabSelect={handleTabSelect} />
    </div>
  );
}
