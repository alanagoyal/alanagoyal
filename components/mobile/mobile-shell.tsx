"use client";

import { useState, useEffect } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp } from "@/components/apps/finder/finder-app";

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
    } else if (path.startsWith("/iterm")) {
      setActiveAppId("iterm");
    } else if (path.startsWith("/finder")) {
      setActiveAppId("finder");
    } else if (initialApp) {
      setActiveAppId(initialApp);
    }
    setIsHydrated(true);
  }, [initialApp]);

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <RecentsProvider>
      <div className="h-dvh flex flex-col bg-background">
        {activeAppId === "notes" && (
          <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} />
        )}
        {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={false} />}
        {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
        {activeAppId === "iterm" && <ITermApp isMobile={true} inShell={false} />}
        {activeAppId === "finder" && <FinderApp isMobile={true} inShell={false} />}
      </div>
    </RecentsProvider>
  );
}
