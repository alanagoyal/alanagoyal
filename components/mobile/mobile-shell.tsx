"use client";

import { useState, useEffect } from "react";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";

const DEFAULT_APP = "notes";

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
}

export function MobileShell({ initialApp, initialNoteSlug }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(initialApp || DEFAULT_APP);
  const [isHydrated, setIsHydrated] = useState(false);

  // Determine active app from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/settings")) {
      setActiveAppId("settings");
    } else if (path.startsWith("/messages")) {
      setActiveAppId("messages");
    } else if (path.startsWith("/notes")) {
      setActiveAppId("notes");
    } else if (initialApp) {
      setActiveAppId(initialApp);
    }
    setIsHydrated(true);
  }, [initialApp]);

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      {activeAppId === "notes" && (
        <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} />
      )}
      {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={false} />}
      {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
    </div>
  );
}
