"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Icons } from "@/components/icons";

interface ResizableLayoutProps {
  children: React.ReactNode;
  data: any;
}

export default function ResizableLayout({
  children,
  data,
}: ResizableLayoutProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  if (isMobile === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1c1c1c]">
        <Icons.spinner className="w-8 h-8 text-[#e2a727] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1c1c1c] text-white min-h-screen flex">
      {isMobile ? (
        showSidebar ? (
          <div className="w-full">
            {data && <Sidebar notes={data} onNoteSelect={() => setShowSidebar(false)} />}
          </div>
        ) : (
          <div className="w-full pt-2">
            <Button variant="ghost" onClick={toggleSidebar} className="p-2 m-2">
              <ChevronLeft className="w-5 h-5 text-[#e2a727]" />
              <span className="text-[#e2a727] text-base ml-1">Notes</span>
            </Button>
            {children}
          </div>
        )
      ) : (
        <>
          <div className="w-64 border-r border-gray-300/20">
            {data && <Sidebar notes={data} />}
          </div>
          <div className="flex-1">
            {children}
          </div>
        </>
      )}
      <Toaster />
    </div>
  );
}

