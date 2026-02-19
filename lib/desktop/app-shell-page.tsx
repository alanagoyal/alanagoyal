"use client";

import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

interface AppShellPageProps {
  appId?: string;
  initialNoteSlug?: string;
  initialTextEditFile?: string;
  initialPreviewFile?: string;
  forceMobile?: boolean;
}

export function AppShellPage({
  appId,
  initialNoteSlug,
  initialTextEditFile,
  initialPreviewFile,
  forceMobile = false,
}: AppShellPageProps) {
  if (forceMobile) {
    return <MobileShell initialApp={appId || "notes"} initialNoteSlug={initialNoteSlug} />;
  }

  return (
    <Desktop
      initialAppId={appId}
      initialNoteSlug={initialNoteSlug}
      initialTextEditFile={initialTextEditFile}
      initialPreviewFile={initialPreviewFile}
    />
  );
}
