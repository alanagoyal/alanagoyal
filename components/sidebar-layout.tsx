"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobileDetect } from "./mobile-detector";
import { useRouter, usePathname } from "next/navigation";
import { SessionNotesProvider } from "@/app/notes/session-notes";
import Sidebar from "./sidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
  notes: any;
}

export default function SidebarLayout({ children, notes }: SidebarLayoutProps) {
  const isMobile = useMobileDetect();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isMobile !== null && !isMobile && pathname === "/notes") {
      router.push("/notes/about-me");
    }
  }, [isMobile, router, pathname]);

  const handleNoteSelect = (note: any) => {
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
            <ScrollArea className="h-full" isMobile={isMobile}>
              {children}
            </ScrollArea>
          </div>
        )}
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
