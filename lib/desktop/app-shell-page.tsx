"use client";

import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { SHELL_DEFAULT_APP_ID } from "@/lib/shell-routing";
import { useShellIsMobile } from "@/lib/use-shell-is-mobile";

interface AppShellPageProps {
  appId?: string;
  initialNoteSlug?: string;
  initialTextEditFile?: string;
  initialPreviewFile?: string;
}

export function AppShellPage({
  appId,
  initialNoteSlug,
  initialTextEditFile,
  initialPreviewFile,
}: AppShellPageProps) {
  const isMobile = useShellIsMobile();

  if (isMobile === null) return null;

  if (isMobile) {
    return <MobileShell initialApp={appId || SHELL_DEFAULT_APP_ID} initialNoteSlug={initialNoteSlug} />;
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
