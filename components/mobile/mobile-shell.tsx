"use client";

import { useState, useEffect } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { SystemSettingsProvider } from "@/lib/system-settings-context";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp } from "@/components/apps/finder/finder-app";
import { PhotosApp } from "@/components/apps/photos/photos-app";
import { CalendarApp } from "@/components/apps/calendar/calendar-app";
import { MusicApp } from "@/components/apps/music/music-app";
import { TextEditApp } from "@/components/apps/textedit";
import { getTextEditContent } from "@/lib/file-storage";

const DEFAULT_APP = "notes";

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
  initialTextEditFile?: string;
}

export function MobileShell({ initialApp, initialNoteSlug, initialTextEditFile }: MobileShellProps) {
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
    } else if (path.startsWith("/photos")) {
      setActiveAppId("photos");
    } else if (path.startsWith("/calendar")) {
      setActiveAppId("calendar");
    } else if (path.startsWith("/music")) {
      setActiveAppId("music");
    } else if (path.startsWith("/textedit")) {
      setActiveAppId("textedit");
    } else if (initialApp) {
      setActiveAppId(initialApp);
    }
    setIsHydrated(true);
  }, [initialApp]);

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <SystemSettingsProvider>
      <RecentsProvider>
        <div className="h-dvh flex flex-col bg-background">
          {activeAppId === "notes" && (
            <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} />
          )}
          {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={false} />}
          {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
          {activeAppId === "iterm" && <ITermApp isMobile={true} inShell={false} />}
          {activeAppId === "finder" && <FinderApp isMobile={true} inShell={false} />}
          {activeAppId === "photos" && <PhotosApp isMobile={true} inShell={false} />}
          {activeAppId === "calendar" && <CalendarApp isMobile={true} inShell={false} />}
          {activeAppId === "music" && <MusicApp isMobile={true} inShell={false} />}
          {activeAppId === "textedit" && (
            <TextEditApp
              isMobile={true}
              inShell={false}
              initialFilePath={initialTextEditFile}
              initialContent={initialTextEditFile ? getTextEditContent(initialTextEditFile) ?? "" : ""}
            />
          )}
        </div>
      </RecentsProvider>
    </SystemSettingsProvider>
  );
}
