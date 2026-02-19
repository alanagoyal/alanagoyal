"use client";

import { useCallback, useEffect, useState } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { Note as NoteType } from "@/lib/notes/types";
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
import { APP_SHELL_URL_CHANGE_EVENT, pushUrl } from "@/lib/set-url";

const DEFAULT_APP = "notes";

function getAppIdFromPathname(pathname: string, fallbackApp?: string): string {
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname.startsWith("/notes")) return "notes";
  if (pathname.startsWith("/iterm")) return "iterm";
  if (pathname.startsWith("/finder")) return "finder";
  if (pathname.startsWith("/photos")) return "photos";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/music")) return "music";
  if (pathname.startsWith("/textedit")) return "textedit";
  if (pathname.startsWith("/preview")) return "preview";
  return fallbackApp || DEFAULT_APP;
}

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
  initialNote?: NoteType;
}

export function MobileShell({ initialApp, initialNoteSlug, initialNote }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(initialApp || DEFAULT_APP);

  // Topmost windows from desktop session (loaded from sessionStorage)
  const [topmostTextEdit, setTopmostTextEdit] = useState<{ filePath: string; content: string } | null>(null);
  const [topmostPreview, setTopmostPreview] = useState<{ filePath: string; fileUrl: string; fileType: PreviewFileType } | null>(null);

  const handleOpenAppFromFinder = useCallback((nextAppId: string) => {
    setActiveAppId(nextAppId);
    pushUrl(`/${nextAppId}`);
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
      const searchParams = new URLSearchParams(window.location.search);
      const fileParam = searchParams.get("file");

      setActiveAppId(getAppIdFromPathname(path, initialApp));

      if (fileParam && path.startsWith("/textedit")) {
        setTopmostTextEdit((current) => {
          if (current?.filePath === fileParam) return current;
          return {
            filePath: fileParam,
            content: getTextEditContent(fileParam) ?? "",
          };
        });
      }

      if (fileParam && path.startsWith("/preview")) {
        const previewMetadata = getPreviewMetadataFromPath(fileParam);
        if (previewMetadata) {
          setTopmostPreview((current) => {
            if (current?.filePath === fileParam) return current;
            return {
              filePath: fileParam,
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
          <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} initialNote={initialNote} />
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
