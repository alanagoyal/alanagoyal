"use client";

import { NotesApp } from "@/components/apps/notes/notes-app";
import { RecentsProvider } from "@/lib/recents-context";

interface MobileNotesPageProps {
  initialSlug?: string;
}

export function MobileNotesPage({ initialSlug }: MobileNotesPageProps) {
  return (
    <RecentsProvider>
      <div className="h-dvh bg-background">
        <NotesApp isMobile={true} inShell={false} initialSlug={initialSlug} />
      </div>
    </RecentsProvider>
  );
}
