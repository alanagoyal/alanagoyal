"use client";

import React, { useState, useCallback } from "react";
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
  const minSize = 10;

  const handleResize = useCallback((size: number) => {
    setIsCollapsed(size <= minSize);
  }, []);

  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      <ResizablePanelGroup direction="horizontal" className="flex min-h-screen">
        <ResizablePanel
          defaultSize={20}
          minSize={minSize}
          maxSize={30}
          onResize={handleResize}
        >
          {data && <Sidebar notes={data} isCollapsed={isCollapsed} />}
        </ResizablePanel>
        <ResizableHandle className="bg-gray-500" />
        <ResizablePanel defaultSize={80}>
          {children}
          <Toaster />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
