"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobileDetect } from "./mobile-detector";
import { useRouter, usePathname } from "next/navigation";
import { SessionNotesProvider } from "@/app/(desktop)/notes/session-notes";
import Sidebar from "./sidebar";
import { Note } from "@/lib/notes/types";

interface SidebarLayoutProps {
  children: React.ReactNode;
  notes: Note[];
}

export default function SidebarLayout({ children, notes }: SidebarLayoutProps) {
  const isMobile = useMobileDetect();
  const router = useRouter();
  const pathname = usePathname();

  const handleNoteSelect = (note: Note) => {
    router.push(`/notes/${note.slug}`);
  };

  if (isMobile === null) {
    return null;
  }

  const showSidebar = !isMobile || pathname === "/notes";

  return (
    <SessionNotesProvider>
      <div className="dark:text-white h-dvh flex">
        {showSidebar && (
          <Sidebar
            notes={notes}
            onNoteSelect={isMobile ? handleNoteSelect : () => {}}
            isMobile={isMobile}
          />
        )}
        {(!isMobile || !showSidebar) && (
          <div className="flex-grow h-dvh">
            <ScrollArea className="h-full" isMobile={isMobile} bottomMargin="0px">
              {children}
            </ScrollArea>
          </div>
        )}
      </div>
    </SessionNotesProvider>
  );
}
