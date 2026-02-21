"use client";

import { useCallback, useEffect, useState } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { ITermApp } from "@/components/apps/iterm/iterm-app";
import { FinderApp } from "@/components/apps/finder/finder-app";
import { PhotosApp } from "@/components/apps/photos/photos-app";
import { CalendarApp } from "@/components/apps/calendar/calendar-app";
import { MusicApp } from "@/components/apps/music/music-app";
import { APP_SHELL_URL_CHANGE_EVENT, pushUrl, setUrl } from "@/lib/set-url";
import type { Note as NoteType } from "@/lib/notes/types";
import {
  getShellAppIdForContext,
  getShellUrlForApp,
  parseShellLocation,
  SHELL_DEFAULT_APP_ID,
} from "@/lib/shell-routing";

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
  initialNote?: NoteType;
}

export function MobileShell({ initialApp, initialNoteSlug, initialNote }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(
    getShellAppIdForContext(initialApp || SHELL_DEFAULT_APP_ID, "mobile")
  );
  const [activeNoteSlug, setActiveNoteSlug] = useState<string | undefined>(initialNoteSlug);

  const handleOpenAppFromFinder = useCallback((nextAppId: string) => {
    const resolvedAppId = getShellAppIdForContext(nextAppId, "mobile");
    setActiveAppId(resolvedAppId);
    const nextUrl = getShellUrlForApp(resolvedAppId, { context: "mobile" });
    if (nextUrl) {
      pushUrl(nextUrl);
    }
  }, []);

  // Determine active app from URL and load topmost windows on hydration
  useEffect(() => {
    const syncFromLocation = () => {
      const path = window.location.pathname;
      const { normalizedPathname, appId: nextAppId, noteSlug } = parseShellLocation(
        path,
        window.location.search,
        { fallbackAppId: initialApp || SHELL_DEFAULT_APP_ID, context: "mobile" }
      );

      if (path !== normalizedPathname) {
        setUrl(normalizedPathname);
      }

      setActiveAppId(nextAppId);
      setActiveNoteSlug(noteSlug);
    };

    syncFromLocation();

    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener(APP_SHELL_URL_CHANGE_EVENT, syncFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener(APP_SHELL_URL_CHANGE_EVENT, syncFromLocation);
    };
  }, [initialApp]);

  return (
    <RecentsProvider>
      <div className="h-dvh flex flex-col bg-background">
        {activeAppId === "notes" && (
          <NotesApp
            isMobile={true}
            inShell={false}
            initialSlug={activeNoteSlug}
            initialNote={activeNoteSlug === initialNoteSlug ? initialNote : undefined}
          />
        )}
        {activeAppId === "messages" && <MessagesApp isMobile={true} inShell={false} />}
        {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
        {activeAppId === "iterm" && <ITermApp isMobile={true} inShell={false} />}
        {activeAppId === "finder" && (
          <FinderApp isMobile={true} inShell={false} onOpenApp={handleOpenAppFromFinder} />
        )}
        {activeAppId === "photos" && <PhotosApp isMobile={true} inShell={false} />}
        {activeAppId === "calendar" && <CalendarApp isMobile={true} inShell={false} />}
        {activeAppId === "music" && <MusicApp isMobile={true} />}
      </div>
    </RecentsProvider>
  );
}
