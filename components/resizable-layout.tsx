"use client";

import React, { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    
    // Set initial state
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-[#1c1c1c] text-white min-h-screen">
      <ResizablePanelGroup direction="horizontal" className="flex min-h-screen">
        {isMobile ? (
          <div className="w-1/5"> 
            {data && <Sidebar notes={data} isMobile={isMobile} />}
          </div>
        ) : (
          <>
            <ResizablePanel
              defaultSize={25}
              minSize={20}
              maxSize={50}
            >
              {data && <Sidebar notes={data} isMobile={isMobile} />}
            </ResizablePanel>
            <ResizableHandle className="bg-gray-500" />
          </>
        )}
        <ResizablePanel defaultSize={75}>
          {children}
          <Toaster />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
