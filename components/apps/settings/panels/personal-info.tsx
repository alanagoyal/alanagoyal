"use client";

import { ChevronRight } from "lucide-react";

interface Device {
  name: string;
  model: string;
  type: "macbook-air" | "macbook-pro" | "iphone" | "ipad" | "watch";
  isCurrentDevice?: boolean;
}

const devices: Device[] = [
  { name: "Alana's MacBook Air", model: "This MacBook Air", type: "macbook-air", isCurrentDevice: true },
  { name: "Alana Anderson's iPhone 6 plus", model: "iPhone 6s Plus", type: "iphone" },
  { name: "Alana Anderson's iPhone 6 plus", model: "iPhone 7 Plus", type: "iphone" },
  { name: "Alana Anderson's iPhone 6 plus", model: "iPhone XS Max", type: "iphone" },
  { name: "Alana Anderson's MacBook Pro", model: "MacBook Pro 13\"", type: "macbook-pro" },
  { name: "Alana Anderson's iPad", model: "iPad Air", type: "ipad" },
  { name: "Alana's Apple Watch", model: "Apple Watch", type: "watch" },
  { name: "alana's iphone", model: "iPhone 16 Pro", type: "iphone" },
  { name: "Alana's MacBook Air", model: "MacBook Air 13\"", type: "macbook-air" },
];

function DeviceIcon({ type }: { type: Device["type"] }) {
  switch (type) {
    case "macbook-air":
    case "macbook-pro":
      return (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <rect x="6" y="8" width="28" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
          <rect x="8" y="10" width="24" height="14" rx="0.5" className="fill-sky-200" />
          <path d="M4 26h32l-2 4H6l-2-4z" fill="currentColor" className="text-gray-300" />
        </svg>
      );
    case "iphone":
      return (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <rect x="11" y="4" width="18" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
          <rect x="13" y="7" width="14" height="24" rx="1" className="fill-emerald-100" />
          <circle cx="20" cy="33" r="1.5" stroke="currentColor" strokeWidth="1" className="text-gray-400" />
        </svg>
      );
    case "ipad":
      return (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <rect x="6" y="6" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
          <rect x="8" y="8" width="24" height="24" rx="1" className="fill-emerald-100" />
          <circle cx="20" cy="34" r="1" fill="currentColor" className="text-gray-400" />
        </svg>
      );
    case "watch":
      return (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <rect x="12" y="8" width="16" height="4" rx="1" fill="currentColor" className="text-gray-300" />
          <rect x="12" y="28" width="16" height="4" rx="1" fill="currentColor" className="text-gray-300" />
          <rect x="10" y="11" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-gray-400" />
          <rect x="12" y="13" width="16" height="14" rx="2" className="fill-rose-100" />
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
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <DeviceIcon type={device.type} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{device.name}</div>
                  <div className="text-xs text-muted-foreground">{device.model}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
