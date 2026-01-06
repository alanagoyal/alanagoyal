"use client";

import Image from "next/image";
import { APPS } from "@/lib/app-config";
import { cn } from "@/lib/utils";

interface TabBarProps {
  activeAppId: string | null;
  onTabSelect: (appId: string | null) => void;
}

export function TabBar({ activeAppId, onTabSelect }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-black/10 dark:border-white/10 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {APPS.map((app) => {
          const isActive = activeAppId === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onTabSelect(app.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive
                  ? "text-blue-500"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <div className="w-7 h-7 relative">
                <Image
                  src={app.icon}
                  alt={app.name}
                  width={28}
                  height={28}
                  className={cn("rounded-md", !isActive && "opacity-60")}
                />
              </div>
              <span className="text-[10px] font-medium">{app.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
