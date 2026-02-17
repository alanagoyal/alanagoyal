"use client";

import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { useDesktopShellRoute } from "@/lib/desktop/use-desktop-shell-route";

export default function ITermPage() {
  const { isMobile, isHydrated, route } = useDesktopShellRoute({
    defaultAppId: "iterm",
  });

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isMobile) {
    return <MobileShell initialApp={route.appId} initialNoteSlug={route.noteSlug} />;
  }

  return (
    <Desktop
      initialAppId={route.appId}
      initialNoteSlug={route.noteSlug}
      initialTextEditFile={route.textEditFile}
      initialPreviewFile={route.previewFile}
    />
  );
}
