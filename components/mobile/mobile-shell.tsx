"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { useSystemSettings } from "@/lib/system-settings-context";
import { getWallpaperPath } from "@/lib/os-versions";

const DEFAULT_APP = "notes";
const WINDOW_STATE_STORAGE_KEY = "desktop-window-state";

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
}

export function MobileShell({ initialApp, initialNoteSlug }: MobileShellProps) {
  const { currentOS } = useSystemSettings();
  const [activeAppId, setActiveAppId] = useState<string | null>(initialApp || DEFAULT_APP);
  const [isHydrated, setIsHydrated] = useState(false);

  // Topmost windows from desktop session (loaded from sessionStorage)
  const [topmostTextEdit, setTopmostTextEdit] = useState<{ filePath: string; content: string } | null>(null);
  const [topmostPreview, setTopmostPreview] = useState<{ filePath: string; fileUrl: string; fileType: PreviewFileType } | null>(null);

  // Determine active app from URL and load topmost windows on hydration
  useEffect(() => {
    let nextActiveAppId: string | null = initialApp || DEFAULT_APP;

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
      nextActiveAppId = "settings";
    } else if (path.startsWith("/messages")) {
      nextActiveAppId = "messages";
    } else if (path.startsWith("/notes")) {
      nextActiveAppId = "notes";
    } else if (path.startsWith("/iterm")) {
      nextActiveAppId = "iterm";
    } else if (path.startsWith("/finder")) {
      nextActiveAppId = "finder";
    } else if (path.startsWith("/photos")) {
      nextActiveAppId = "photos";
    } else if (path.startsWith("/calendar")) {
      nextActiveAppId = "calendar";
    } else if (path.startsWith("/music")) {
      nextActiveAppId = "music";
    } else if (path.startsWith("/textedit")) {
      nextActiveAppId = "textedit";
    } else if (path.startsWith("/preview")) {
      nextActiveAppId = "preview";
    } else if (initialApp) {
      nextActiveAppId = initialApp;
    }

    // If route is "/" and this session currently has no focused/visible windows,
    // preserve the blank desktop state when resizing into mobile.
    if (!initialApp && path === "/") {
      try {
        const raw = window.sessionStorage.getItem(WINDOW_STATE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            focusedWindowId?: string | null;
            windows?: Record<string, { isOpen?: boolean; isMinimized?: boolean }>;
          };
          const windows = Object.values(parsed.windows ?? {});
          const hasVisibleWindows = windows.some((w) => w.isOpen && !w.isMinimized);
          if (!parsed.focusedWindowId && !hasVisibleWindows) {
            nextActiveAppId = null;
          }
        }
      } catch {
        // Fall back to default app behavior.
      }
    }

    setActiveAppId(nextActiveAppId);

    if (fileParam) {
      if (path.startsWith("/textedit") && !hasSavedTextEdit) {
        setTopmostTextEdit({
          filePath: fileParam,
          content: getTextEditContent(fileParam) ?? "",
        });
      }

      if (path.startsWith("/preview") && !hasSavedPreview) {
        const previewMetadata = getPreviewMetadataFromPath(fileParam);
        if (previewMetadata) {
          setTopmostPreview({
            filePath: fileParam,
            fileUrl: previewMetadata.fileUrl,
            fileType: previewMetadata.fileType,
          });
        }
      }
    }
    setIsHydrated(true);
  }, [initialApp]);

  if (!isHydrated) {
    return (
      <div className="relative min-h-dvh">
        <Image
          src={getWallpaperPath(currentOS.id)}
          alt="Desktop wallpaper"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>
    );
  }

  return (
    <RecentsProvider>
      <div className="relative h-dvh flex flex-col">
        <Image
          src={getWallpaperPath(currentOS.id)}
          alt="Desktop wallpaper"
          fill
          className="object-cover -z-10"
          priority
          quality={90}
        />
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
