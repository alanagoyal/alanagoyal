"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";

interface ResizableLayoutProps {
  children: React.ReactNode;
  data: any;
}

export default function ResizableLayout({
  children,
  data,
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [defaultSidebarSize, setDefaultSidebarSize] = useState(25);
  const [minSidebarSize, setMinSidebarSize] = useState(10);
  const [defaultNoteSize, setDefaultNoteSize] = useState(75);

  const handleResize = useCallback((size: number) => {
    setIsCollapsed(size <= minSidebarSize);
  }, [minSidebarSize]);

  // Effect to handle mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsCollapsed(isMobile);
      setDefaultSidebarSize(isMobile ? 30 : 25);
      setDefaultNoteSize(isMobile ? 70 : 75);
      setMinSidebarSize(isMobile ? 30 : 10);
    };

    // Set initial state based on window size
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      <ResizablePanelGroup direction="horizontal" className="flex min-h-screen">
        <ResizablePanel
          defaultSize={defaultSidebarSize}
          minSize={minSidebarSize}
          maxSize={50}
          onResize={handleResize}
        >
          {data && <Sidebar notes={data} isCollapsed={isCollapsed} />}
        </ResizablePanel>
        <ResizableHandle className="bg-gray-500" />
        <ResizablePanel defaultSize={defaultNoteSize}>
          {children}
          <Toaster />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
