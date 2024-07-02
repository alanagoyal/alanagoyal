"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Icons } from "@/components/icons";
import { useMobileDetect } from "./mobile-detector";
import Sidebar from "./sidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
  data: any;
}

export default function SidebarLayout({
  children,
  data,
}: SidebarLayoutProps) {
  const isMobile = useMobileDetect();

  return (
    <>
      {isMobile === null ? (
        <div className="flex items-center justify-center min-h-screen bg-[#1c1c1c]">
          <Icons.spinner className="w-8 h-8 text-[#e2a727] animate-spin" />
          <div className="hidden">{children}</div>
        </div>
      ) : isMobile ? (
        <div className="bg-[#1c1c1c] text-white min-h-screen">
          {children}
          <Toaster />
        </div>
      ) : (
        <div className="bg-[#1c1c1c] text-white min-h-screen flex">
          <div className="w-64 flex-shrink-0 border-r border-gray-300/20 overflow-y-auto h-screen">
            {data && <Sidebar notes={data} onNoteSelect={() => {}} />}
          </div>
          <div className="flex-grow overflow-y-auto h-screen">{children}</div>
          <Toaster />
        </div>
      )}
    </>
  );
}