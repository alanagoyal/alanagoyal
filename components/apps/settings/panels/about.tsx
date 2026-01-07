"use client";

import Image from "next/image";

export function AboutPanel() {
  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      {/* MacBook Image */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-24 mb-4">
          <svg
            viewBox="0 0 120 90"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Screen bezel */}
            <rect
              x="10"
              y="5"
              width="100"
              height="65"
              rx="4"
              className="fill-zinc-800 dark:fill-zinc-700"
            />
            {/* Screen */}
            <rect
              x="14"
              y="9"
              width="92"
              height="55"
              rx="2"
              className="fill-sky-400"
            />
            {/* Notch */}
            <rect
              x="52"
              y="5"
              width="16"
              height="4"
              rx="2"
              className="fill-zinc-900 dark:fill-zinc-600"
            />
            {/* Base */}
            <path
              d="M5 70h110l-5 8H10l-5-8z"
              className="fill-zinc-300 dark:fill-zinc-600"
            />
            {/* Trackpad indent */}
            <rect
              x="40"
              y="71"
              width="40"
              height="3"
              rx="1.5"
              className="fill-zinc-400 dark:fill-zinc-500"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold">MacBook Air</h2>
        <p className="text-sm text-muted-foreground">M2, 2022</p>
      </div>

      {/* Specs Table */}
      <div className="rounded-xl bg-muted/50 overflow-hidden mb-6">
        <div className="divide-y divide-border/50">
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm">Alana&apos;s MacBook Air</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Chip</span>
            <span className="text-sm">Apple M2</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Memory</span>
            <span className="text-sm">24 GB</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Serial number</span>
            <span className="text-sm">L76NXH926Q</span>
          </div>
        </div>
      </div>

      {/* macOS Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">macOS</h3>
        <div className="rounded-xl bg-muted/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <svg
                  viewBox="0 0 40 40"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Sonoma gradient background */}
                  <defs>
                    <linearGradient id="sonoma" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B6B" />
                      <stop offset="25%" stopColor="#FFB347" />
                      <stop offset="50%" stopColor="#FFEB3B" />
                      <stop offset="75%" stopColor="#98D8C8" />
                      <stop offset="100%" stopColor="#6B5B95" />
                    </linearGradient>
                  </defs>
                  <rect width="40" height="40" rx="8" fill="url(#sonoma)" />
                </svg>
              </div>
              <span className="text-sm">macOS Sonoma</span>
            </div>
            <span className="text-sm text-muted-foreground">Version 14.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
