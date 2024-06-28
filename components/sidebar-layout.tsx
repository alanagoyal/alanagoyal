"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

interface ResizableLayoutProps {
  children: React.ReactNode;
  data: any;
}

export default function ResizableLayout({
  children,
  data,
}: ResizableLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Effect to handle mobile view
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      const currentIsMobile = window.innerWidth <= 768;
      setIsMobile(currentIsMobile);
    };

    // Set initial state based on window size
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setShowSidebar(!showSidebar);

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
