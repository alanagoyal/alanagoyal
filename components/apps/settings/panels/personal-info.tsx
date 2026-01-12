"use client";

import { ChevronRight } from "lucide-react";

export function PersonalInfoPanel() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      {/* Personal Information Card */}
      <div className="rounded-xl bg-muted/50 overflow-hidden">
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs">Name</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">Alana Goyal</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs">Birthday</span>
            <span className="text-xs text-muted-foreground">1/12/1996</span>
          </div>
        </div>
      </div>
    </div>
  );
}
