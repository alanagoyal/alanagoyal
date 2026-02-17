"use client";

import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { useDesktopShellRoute } from "@/lib/desktop/use-desktop-shell-route";

export default function SettingsPage() {
  const { isMobile, isHydrated, route } = useDesktopShellRoute({
    defaultAppId: "settings",
  });

  // Prevent flash during hydration - use neutral background
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
