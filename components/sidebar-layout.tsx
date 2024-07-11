"use client";

import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useMobileDetect } from "./mobile-detector";
import Sidebar from "./sidebar";
import { useRouter, usePathname } from "next/navigation";
import { SessionNotesProvider } from "@/app/session-notes";

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
      <div className="bg-[#1c1c1c] text-white min-h-dvh flex">
        {showSidebar && (
          <div
            className={`${
              isMobile
                ? "w-full"
                : "w-64 flex-shrink-0 border-r border-gray-400/20"
            } overflow-y-auto h-dvh`}
          >
            <Sidebar
              notes={notes}
              onNoteSelect={isMobile ? handleNoteSelect : () => {}}
              isMobile={isMobile}
            />
          </div>
        )}
        {(!isMobile || !showSidebar) && (
          <div className="flex-grow overflow-y-auto h-dvh">{children}</div>
        )}
        <Toaster />
      </div>
    </SessionNotesProvider>
  );
}
