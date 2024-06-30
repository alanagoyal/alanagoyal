"use client";

import React, { useState, useEffect, createContext } from "react";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Icons } from "@/components/icons";

interface SidebarLayoutProps {
  children: React.ReactNode;
  data: any;
}

export const MobileContext = createContext<{
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>> | null;
}>({ setShowSidebar: null });

export default function SidebarLayout({
  children,
  data,
}: SidebarLayoutProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MobileContext.Provider value={{ setShowSidebar }}>
      {isMobile === null ? (
        <div className="flex items-center justify-center min-h-screen bg-[#1c1c1c]">
          <Icons.spinner className="w-8 h-8 text-[#e2a727] animate-spin" />
          <div className="hidden">{children}</div>
        </div>
      ) : isMobile ? (
        <div className="bg-[#1c1c1c] text-white min-h-screen">
          {showSidebar ? (
            <div className="w-full">
              {data && (
                <Sidebar
                  notes={data}
                  onNoteSelect={() => {
                    setShowSidebar(false);
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full">
              <button
                onClick={() => setShowSidebar(true)}
                className="pt-4 m-2 flex items-center"
              >
                <ChevronLeft className="w-5 h-5 text-[#e2a727]" />
                <span className="text-[#e2a727] text-base ml-1">Notes</span>
              </button>
              {children}
            </div>
          )}
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
    </MobileContext.Provider>
  );
}