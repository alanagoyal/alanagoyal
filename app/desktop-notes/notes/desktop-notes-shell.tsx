"use client";

import dynamic from "next/dynamic";

const Desktop = dynamic(
  () => import("@/components/desktop/desktop").then((mod) => mod.Desktop),
  {
    ssr: false,
    loading: () => <div className="h-dvh bg-background" />,
  }
);

interface DesktopNotesShellProps {
  initialSlug?: string;
}

export function DesktopNotesShell({ initialSlug }: DesktopNotesShellProps) {
  return <Desktop initialAppId="notes" initialNoteSlug={initialSlug} />;
}
