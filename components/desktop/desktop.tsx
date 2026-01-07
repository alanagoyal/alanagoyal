"use client";

import { useCallback } from "react";
import { WindowManagerProvider } from "@/lib/window-context";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";

interface DesktopProps {
  initialAppId?: string; // App to open and focus on load
  initialNoteSlug?: string; // For notes app: which note to select
}

export function Desktop({ initialAppId, initialNoteSlug }: DesktopProps) {
  // Update URL when messages window is focused
  const handleMessagesFocus = useCallback(() => {
    window.history.replaceState(null, "", "/messages");
  }, []);

  // Update URL when notes window is focused - preserve current note or use initial
  const handleNotesFocus = useCallback(() => {
    // If already on a notes URL, keep it; otherwise use initial or default
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/notes/")) {
      const slug = initialNoteSlug || "about-me";
      window.history.replaceState(null, "", `/notes/${slug}`);
    }
  }, [initialNoteSlug]);

  return (
    <WindowManagerProvider initialAppId={initialAppId}>
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <MenuBar />

        <Window appId="notes" onFocus={handleNotesFocus}>
          <NotesApp inShell={true} initialSlug={initialNoteSlug} />
        </Window>

        <Window appId="messages" onFocus={handleMessagesFocus}>
          <MessagesApp inShell={true} />
        </Window>

        <Dock />
      </div>
    </WindowManagerProvider>
  );
}
