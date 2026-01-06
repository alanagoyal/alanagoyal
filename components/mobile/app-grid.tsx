"use client";

import Image from "next/image";
import { APPS } from "@/lib/app-config";

interface AppGridProps {
  onAppSelect: (appId: string) => void;
}

export function AppGrid({ onAppSelect }: AppGridProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-8 pt-16">
      <div className="grid grid-cols-4 gap-6 max-w-md mx-auto">
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => onAppSelect(app.id)}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 relative">
              <Image
                src={app.icon}
                alt={app.name}
                width={64}
                height={64}
                className="rounded-2xl shadow-lg"
              />
            </div>
            <span className="text-xs font-medium text-white drop-shadow-md">
              {app.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
