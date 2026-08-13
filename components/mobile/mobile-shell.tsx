"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { APP_SHELL_URL_CHANGE_EVENT, setUrl } from "@/lib/set-url";
import type { Note as NoteType } from "@/lib/notes/types";
import { useSystemSettings } from "@/lib/system-settings-context";
import {
  getShellAppIdForContext,
  parseShellLocation,
  SHELL_DEFAULT_APP_ID,
} from "@/lib/shell-routing";

const NotesApp = dynamic(() => import("@/components/apps/notes/notes-app").then((mod) => mod.NotesApp), {
  ssr: false,
});
const MessagesApp = dynamic(
  () => import("@/components/apps/messages/messages-app").then((mod) => mod.MessagesApp),
  { ssr: false }
);
const PhotosApp = dynamic(() => import("@/components/apps/photos/photos-app").then((mod) => mod.PhotosApp), {
  ssr: false,
});
const CalendarApp = dynamic(
  () => import("@/components/apps/calendar/calendar-app").then((mod) => mod.CalendarApp),
  { ssr: false }
);
const MusicApp = dynamic(() => import("@/components/apps/music/music-app").then((mod) => mod.MusicApp), {
  ssr: false,
});

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
  initialNote?: NoteType;
}

export function MobileShell({ initialApp, initialNoteSlug, initialNote }: MobileShellProps) {
  const { focusMode } = useSystemSettings();
  const [activeAppId, setActiveAppId] = useState<string>(
    getShellAppIdForContext(initialApp || SHELL_DEFAULT_APP_ID, "mobile")
  );
  const [activeNoteSlug, setActiveNoteSlug] = useState<string | undefined>(initialNoteSlug);

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
        {activeAppId === "messages" && (
          <MessagesApp
            isMobile={true}
            inShell={false}
            focusModeActive={focusMode !== "off"}
          />
        )}
        {activeAppId === "photos" && <PhotosApp isMobile={true} inShell={false} />}
        {activeAppId === "calendar" && <CalendarApp isMobile={true} inShell={false} />}
        {activeAppId === "music" && <MusicApp isMobile={true} />}
      </div>
    </RecentsProvider>
  );
}
