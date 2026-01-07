"use client";

import { WindowManagerProvider } from "@/lib/window-context";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { Window } from "./window";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { MessagesApp } from "@/components/apps/messages/messages-app";

export function Desktop() {
  return (
    <WindowManagerProvider>
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <MenuBar />

        <Window appId="notes">
          <NotesApp inShell={true} />
        </Window>

        <Window appId="messages">
          <MessagesApp inShell={true} />
        </Window>

        <Dock />
      </div>
    </WindowManagerProvider>
  );
}
