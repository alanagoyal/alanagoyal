"use client";

import { useEffect, useState } from "react";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (isMobile === null) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isMobile) {
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
