"use client";

import { useState } from "react";
import { Wifi, Lock, MoreHorizontal, Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Wi-Fi signal strength icon component
function WifiSignal({ strength = 3, className }: { strength?: 1 | 2 | 3; className?: string }) {
  return (
    <Wifi className={cn("w-4 h-4", className)} />
  );
}

const knownNetworks = [
  { name: "braintrust", connected: true },
];

const personalHotspots = [
  { name: "alana's iphone" },
];

const otherNetworks = [
  { name: "Abi_Wifi" },
  { name: "Bauhaus" },
  { name: "braintrust_guest" },
  { name: "BSL Visionary" },
  { name: "btrax (guest)" },
  { name: "DIRECT-7A-HP OfficeJet Pro 9730e" },
];

interface WifiPanelProps {
  isMobile?: boolean;
}

export function WifiPanel({ isMobile = false }: WifiPanelProps) {
  const [isEnabled, setIsEnabled] = useState(true);

  // Desktop layout (macOS style)
  return (
    <div className="max-w-2xl">
      {/* Header section with toggle */}
      <div className="flex items-start gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 shrink-0">
          <Wifi className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium">Wi-Fi</span>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={cn(
                "w-10 h-6 rounded-full transition-colors relative shrink-0",
                isEnabled ? "bg-blue-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  isEnabled ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Set up Wi-Fi to wirelessly connect your Mac to the internet. Turn on Wi-Fi, then choose a network to join.{" "}
            <span className="text-blue-500 cursor-pointer hover:underline">Learn More...</span>
          </p>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* Connected network */}
          <div className="py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">braintrust</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Connected
                </span>
                <Lock className="w-4 h-4 text-muted-foreground" />
                <WifiSignal strength={3} className="text-muted-foreground" />
                <button className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors">
                  Details...
                </button>
              </div>
            </div>
          </div>

          {/* Personal Hotspots */}
          <div className="py-4 border-b border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Personal Hotspots</h3>
            <div className="space-y-1">
              {personalHotspots.map((hotspot) => (
                <div
                  key={hotspot.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm">{hotspot.name}</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Known Network */}
          <div className="py-4 border-b border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Known Network</h3>
            <div className="space-y-1">
              {knownNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {network.connected && <Check className="w-4 h-4 text-foreground" />}
                    <span className="text-sm">{network.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <WifiSignal strength={3} className="text-muted-foreground" />
                    <button className="p-1 rounded-full hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Networks */}
          <div className="py-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Other Networks</h3>
            <div className="space-y-1">
              {otherNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm">{network.name}</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <WifiSignal strength={3} className="text-muted-foreground" />
                    <button className="p-1 rounded-full hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
