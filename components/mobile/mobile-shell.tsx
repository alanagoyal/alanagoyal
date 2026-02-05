"use client";

import { useState, useEffect } from "react";
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

const DEFAULT_APP = "notes";
const HOME_DIR = "/Users/alanagoyal";
const PROJECTS_DIR = `${HOME_DIR}/Projects`;

function getPreviewMetadata(filePath: string): { filePath: string; fileUrl: string; fileType: PreviewFileType } | null {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const fileType: PreviewFileType = ext === "pdf" ? "pdf" : "image";

  if (filePath.startsWith(PROJECTS_DIR + "/")) {
    const relativePath = filePath.slice(PROJECTS_DIR.length + 1);
    const parts = relativePath.split("/");
    const repo = parts[0];
    const repoPath = parts.slice(1).join("/");
    const fileUrl = `https://raw.githubusercontent.com/alanagoyal/${repo}/main/${repoPath}`;
    return { filePath, fileUrl, fileType };
  }

  if (filePath.startsWith(`${HOME_DIR}/Documents/`)) {
    const fileName = filePath.slice(`${HOME_DIR}/Documents/`.length);
    const fileUrl = `/documents/${encodeURIComponent(fileName)}`;
    return { filePath, fileUrl, fileType };
  }

  return null;
}

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
}

export function MobileShell({ initialApp, initialNoteSlug }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(initialApp || DEFAULT_APP);
  const [isHydrated, setIsHydrated] = useState(false);

  // Topmost windows from desktop session (loaded from sessionStorage)
  const [topmostTextEdit, setTopmostTextEdit] = useState<{ filePath: string; content: string } | null>(null);
  const [topmostPreview, setTopmostPreview] = useState<{ filePath: string; fileUrl: string; fileType: PreviewFileType } | null>(null);

  // Determine active app from URL and load topmost windows on hydration
  useEffect(() => {
    // Load topmost TextEdit window from desktop session
    const textEditWindow = getTopmostWindowForApp("textedit");
    const hasSavedTextEdit = Boolean(textEditWindow?.metadata?.filePath);
    if (hasSavedTextEdit) {
      setTopmostTextEdit({
        filePath: textEditWindow!.metadata!.filePath as string,
        content: (textEditWindow!.metadata!.content as string) ?? "",
      });
    }

    // Load topmost Preview window from desktop session
    const previewWindow = getTopmostWindowForApp("preview");
    const hasSavedPreview = Boolean(
      previewWindow?.metadata?.filePath && previewWindow?.metadata?.fileUrl && previewWindow?.metadata?.fileType
    );
    if (hasSavedPreview) {
      setTopmostPreview({
        filePath: previewWindow!.metadata!.filePath as string,
        fileUrl: previewWindow!.metadata!.fileUrl as string,
        fileType: previewWindow!.metadata!.fileType as PreviewFileType,
      });
    }

    // Set active app based on URL path
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const fileParam = searchParams.get("file");
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
    } else if (path.startsWith("/preview")) {
      setActiveAppId("preview");
    } else if (initialApp) {
      setActiveAppId(initialApp);
    }

    if (fileParam) {
      if (path.startsWith("/textedit") && !hasSavedTextEdit) {
        setTopmostTextEdit({
          filePath: fileParam,
          content: getTextEditContent(fileParam) ?? "",
        });
      }

      if (path.startsWith("/preview") && !hasSavedPreview) {
        const previewMetadata = getPreviewMetadata(fileParam);
        if (previewMetadata) {
          setTopmostPreview(previewMetadata);
        }
      }
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
