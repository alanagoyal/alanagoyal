"use client";

import { ChevronRight } from "lucide-react";

interface Device {
  name: string;
  model: string;
  type: "macbook" | "iphone" | "ipad" | "apple-tv";
}

const devices: Device[] = [
  { name: "Alana's MacBook Air", model: "This MacBook Air", type: "macbook" },
  { name: "Alana's iPhone 16 Pro", model: "iPhone 16 Pro", type: "iphone" },
  { name: "Alana's iPad", model: "iPad Air", type: "ipad" },
  { name: "Family Room", model: "Apple TV", type: "apple-tv" },
  { name: "Entertainment Room", model: "Apple TV", type: "apple-tv" },
  { name: "Bedroom", model: "Apple TV", type: "apple-tv" },
];

function DeviceIcon({ type }: { type: Device["type"] }) {
  switch (type) {
    case "macbook":
      return (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="macbook-screen" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="40%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="macbook-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <rect x="7" y="8" width="34" height="22" rx="1.5" fill="#1f2937" />
          <rect x="9" y="10" width="30" height="18" rx="1" fill="url(#macbook-screen)" />
          <path d="M4 30h40l-3 5H7l-3-5z" fill="url(#macbook-body)" />
          <rect x="18" y="29.5" width="12" height="1" rx="0.5" fill="#d1d5db" />
        </svg>
      );
    case "iphone":
      return (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="iphone-screen" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x="14" y="4" width="20" height="40" rx="4" fill="#1f2937" />
          <rect x="16" y="7" width="16" height="34" rx="2" fill="url(#iphone-screen)" />
        </svg>
      );
    case "ipad":
      return (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="ipad-screen" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x="12" y="4" width="24" height="40" rx="3" fill="#1f2937" />
          <rect x="14" y="7" width="20" height="34" rx="1.5" fill="url(#ipad-screen)" />
        </svg>
      );
    case "apple-tv":
      return (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="8" width="32" height="32" rx="7" fill="#000000" />
          <text x="24" y="26" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="system-ui">tv</text>
        </svg>
      );
  }
}

export function PersonalInfoPanel() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6">
      {/* Personal Information Card */}
      <div className="rounded-xl bg-muted/50 overflow-hidden">
        <div className="divide-y divide-border/50">
          <a
            href="https://x.com/alanaagoyal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <span className="text-xs">Name</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">Alana Goyal</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </a>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs">Birthday</span>
            <span className="text-xs text-muted-foreground">1/12/1996</span>
          </div>
        </div>
      </div>

      {/* Devices Section */}
      <div>
        <h3 className="text-xs font-semibold mb-2 px-1">Devices</h3>
        <div className="rounded-xl bg-muted/50 overflow-hidden">
          <div className="divide-y divide-border/50">
            {devices.map((device, index) => (
              <div
                key={`${device.name}-${device.model}-${index}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <DeviceIcon type={device.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{device.name}</div>
                  <div className="text-xs text-muted-foreground">{device.model}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
