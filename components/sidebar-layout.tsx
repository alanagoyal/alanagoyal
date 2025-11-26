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

  // Use mobile layout as default during initial detection to avoid layout shift on mobile
  // This also allows children to mount earlier, enabling autoFocus to work
  const effectiveIsMobile = isMobile ?? true;
  const showSidebar = !effectiveIsMobile || pathname === "/notes";
  const isDetecting = isMobile === null;

  return (
    <SessionNotesProvider>
      <div className={`dark:text-white h-dvh flex ${isDetecting ? 'opacity-0' : ''}`}>
        {showSidebar && (
          <Sidebar
            notes={notes}
            onNoteSelect={effectiveIsMobile ? handleNoteSelect : () => {}}
            isMobile={effectiveIsMobile}
          />
        )}
        {(!effectiveIsMobile || !showSidebar) && (
          <div className="flex-grow h-dvh">
            <ScrollArea className="h-full" isMobile={effectiveIsMobile}>
              {children}
            </ScrollArea>
          </div>
        )}
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
