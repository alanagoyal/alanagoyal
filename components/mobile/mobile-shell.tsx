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
import { TextEditApp } from "@/components/apps/textedit";
import { PreviewApp, type PreviewFileType } from "@/components/apps/preview";
import { getTextEditContent } from "@/lib/file-storage";
import { getTopmostWindowForApp } from "@/lib/window-context";
import { getPreviewMetadataFromPath } from "@/lib/preview-utils";
import { APP_SHELL_URL_CHANGE_EVENT, pushUrl, setUrl } from "@/lib/set-url";
import type { Note as NoteType } from "@/lib/notes/types";
import {
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
  const [activeAppId, setActiveAppId] = useState<string>(initialApp || SHELL_DEFAULT_APP_ID);
  const [activeNoteSlug, setActiveNoteSlug] = useState<string | undefined>(initialNoteSlug);

  // Topmost windows from desktop session (loaded from sessionStorage)
  const [topmostTextEdit, setTopmostTextEdit] = useState<{ filePath: string; content: string } | null>(null);
  const [topmostPreview, setTopmostPreview] = useState<{ filePath: string; fileUrl: string; fileType: PreviewFileType } | null>(null);

  const handleOpenAppFromFinder = useCallback((nextAppId: string) => {
    setActiveAppId(nextAppId);
    const nextUrl = getShellUrlForApp(nextAppId, { context: "mobile" });
    if (nextUrl) {
      pushUrl(nextUrl);
    }
  }, []);

  // Determine active app from URL and load topmost windows on hydration
  useEffect(() => {
    // Load topmost TextEdit window from desktop session
    const textEditWindow = getTopmostWindowForApp("textedit");
    if (textEditWindow?.metadata?.filePath) {
      setTopmostTextEdit({
        filePath: textEditWindow!.metadata!.filePath as string,
        content: (textEditWindow!.metadata!.content as string) ?? "",
      });
    }

    // Load topmost Preview window from desktop session
    const previewWindow = getTopmostWindowForApp("preview");
    if (previewWindow?.metadata?.filePath && previewWindow?.metadata?.fileUrl && previewWindow?.metadata?.fileType) {
      setTopmostPreview({
        filePath: previewWindow!.metadata!.filePath as string,
        fileUrl: previewWindow!.metadata!.fileUrl as string,
        fileType: previewWindow!.metadata!.fileType as PreviewFileType,
      });
    }

    const syncFromLocation = () => {
      const path = window.location.pathname;
      const { normalizedPathname, appId: nextAppId, noteSlug, filePath } = parseShellLocation(
        path,
        window.location.search,
        initialApp || SHELL_DEFAULT_APP_ID
      );

      if (path !== normalizedPathname) {
        setUrl(normalizedPathname);
      }

      setActiveAppId(nextAppId);
      setActiveNoteSlug(noteSlug);

      if (filePath && nextAppId === "textedit") {
        setTopmostTextEdit((current) => {
          if (current?.filePath === filePath) return current;
          return {
            filePath,
            content: getTextEditContent(filePath) ?? "",
          };
        });
      }

      if (filePath && nextAppId === "preview") {
        const previewMetadata = getPreviewMetadataFromPath(filePath);
        if (previewMetadata) {
          setTopmostPreview((current) => {
            if (current?.filePath === filePath) return current;
            return {
              filePath,
              fileUrl: previewMetadata.fileUrl,
              fileType: previewMetadata.fileType,
            };
          });
        }
      }
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
        {activeAppId === "textedit" && (() => {
          const filePath = topmostTextEdit?.filePath;
          const content = topmostTextEdit?.content
            ?? (filePath ? getTextEditContent(filePath) ?? "" : "");
          return (
            <TextEditApp
              isMobile={true}
              inShell={false}
              initialFilePath={filePath}
              initialContent={content}
            />
          );
        })()}
        {activeAppId === "preview" && (
          <PreviewApp
            isMobile={true}
            filePath={topmostPreview?.filePath}
            fileUrl={topmostPreview?.fileUrl}
            fileType={topmostPreview?.fileType}
          />
        )}
      </div>
    </RecentsProvider>
  );
}
