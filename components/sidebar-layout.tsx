"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobileDetect } from "./mobile-detector";
import { useRouter, usePathname } from "next/navigation";
import { SessionNotesProvider } from "@/app/notes/session-notes";
import { ClientNoteProvider, useClientNote } from "@/app/notes/client-note-context";
import Sidebar from "./sidebar";
import Note from "./note";

interface SidebarLayoutProps {
  children: React.ReactNode;
  notes: any;
}

function SidebarLayoutContent({
  notes,
  isMobile,
  children
}: {
  notes: any;
  isMobile: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentNote, navigateToNote } = useClientNote();

  useEffect(() => {
    if (isMobile !== null && !isMobile && pathname === "/notes") {
      const aboutMe = notes.find((n: any) => n.slug === "about-me");
      if (aboutMe) {
        navigateToNote(aboutMe);
      }
    }
  }, [isMobile, pathname, notes, navigateToNote]);

  const handleNoteSelect = (note: any) => {
    if (isMobile) {
      router.push(`/notes/${note.slug}`);
    } else {
      navigateToNote(note);
    }
  };

  const showSidebar = !isMobile || pathname === "/notes";

  return (
    <div className="dark:text-white h-dvh flex">
      {showSidebar && (
        <Sidebar
          notes={notes}
          onNoteSelect={handleNoteSelect}
          isMobile={isMobile}
        />
      )}
      {(!isMobile || !showSidebar) && (
        <div className="flex-grow h-dvh">
          <ScrollArea className="h-full" isMobile={isMobile}>
            {/* Show client-side note if we have one (from keyboard nav), otherwise show server-rendered */}
            {currentNote ? (
              <div className="w-full min-h-dvh p-3">
                <Note note={currentNote} />
              </div>
            ) : (
              children
            )}
          </ScrollArea>
        </div>
      )}
      <Toaster />
    </div>
  );
}

export default function SidebarLayout({ children, notes }: SidebarLayoutProps) {
  const isMobile = useMobileDetect();

  if (isMobile === null) {
    return null;
  }

  return (
    <SessionNotesProvider>
      <ClientNoteProvider initialNote={null} publicNotes={notes}>
        <SidebarLayoutContent notes={notes} isMobile={isMobile}>
          {children}
        </SidebarLayoutContent>
      </ClientNoteProvider>
    </SessionNotesProvider>
  );
}
