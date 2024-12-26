"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobileDetect } from "./mobile-detector";
import { useRouter, usePathname } from "next/navigation";
import { SessionNotesProvider } from "@/app/session-notes";
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
    if (isMobile !== null && !isMobile && pathname === "/") {
      router.push("/about-me");
    }
  }, [isMobile, router, pathname]);

  const handleNoteSelect = (note: any) => {
    router.push(`/${note.slug}`);
  };

  if (isMobile === null) {
    return null;
  }

  const showSidebar = !isMobile || pathname === "/";

  return (
    <SessionNotesProvider>
      <div className="dark:text-white h-dvh flex">
        {showSidebar && (
          <div
            className={`${
              isMobile
                ? "w-full max-w-full"
                : "w-[320px] border-r border-muted-foreground/20"
            } h-dvh flex flex-col`}
          >
            <ScrollArea className="h-full flex-1">
              <div className="flex flex-col w-full">
                <Sidebar
                  notes={notes}
                  onNoteSelect={isMobile ? handleNoteSelect : () => {}}
                  isMobile={isMobile}
                />
              </div>
            </ScrollArea>
          </div>
        )}
        {(!isMobile || !showSidebar) && (
          <div className="flex-grow h-dvh">
            <ScrollArea className="h-full">{children}</ScrollArea>
          </div>
        )}
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
