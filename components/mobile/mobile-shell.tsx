"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { APP_SHELL_URL_CHANGE_EVENT, pushUrl, setUrl } from "@/lib/set-url";
import type { Note as NoteType } from "@/lib/notes/types";
import {
  getShellAppIdForContext,
  getShellUrlForApp,
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
const SettingsApp = dynamic(
  () => import("@/components/apps/settings/settings-app").then((mod) => mod.SettingsApp),
  { ssr: false }
);
const ITermApp = dynamic(() => import("@/components/apps/iterm/iterm-app").then((mod) => mod.ITermApp), {
  ssr: false,
});
const FinderApp = dynamic(
  () => import("@/components/apps/finder/finder-app").then((mod) => mod.FinderApp),
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
