"use client";

import { Wifi, Lock, MoreHorizontal, Check, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/lib/system-settings-context";
import { SettingsSwitch } from "../settings-switch";

// Wi-Fi signal strength icon component
function WifiSignal({ className }: { className?: string }) {
  return (
    <Wifi className={cn("w-4 h-4", className)} />
  );
}

const knownNetworks = [
  { name: "basecase", connected: true },
];

const personalHotspots = [
  { name: "alana's iphone" },
];

const otherNetworks = [
  { name: "DIRECT-7A-HP OfficeJet Pro 9730e" },
  { name: "Xfinity Wifi" },
  { name: "Xfinity Mobile" },
];

export function WifiPanel() {
  const { wifiEnabled, setWifiEnabled } = useSystemSettings();

  return (
    <div className="max-w-2xl">
      {/* Header section with toggle */}
      <div className="flex items-start gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 shrink-0">
          <Wifi className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Wi-Fi</span>
            <SettingsSwitch
              aria-label="Wi-Fi"
              checked={wifiEnabled}
              onCheckedChange={setWifiEnabled}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Set up Wi-Fi to wirelessly connect your Mac to the internet. Turn on Wi-Fi, then choose a network to join.{" "}
            <span className="text-blue-500 cursor-pointer can-hover:hover:underline">Learn More...</span>
          </p>
        </div>
      </div>

      {wifiEnabled && (
        <>
          {/* Connected network */}
          <div className="py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">basecase</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Connected
                </span>
                <Lock className="w-4 h-4 text-muted-foreground" />
                <WifiSignal className="text-muted-foreground" />
                <button className="px-3 py-1 text-xs border border-border rounded-md hover:bg-muted/50 transition-colors">
                  Details...
                </button>
              </div>
            </div>
          </div>

          {/* Personal Hotspots */}
          <div className="py-4 border-b border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Personal Hotspots</h3>
            <div className="space-y-1">
              {personalHotspots.map((hotspot) => (
                <div
                  key={hotspot.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg can-hover:hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs">{hotspot.name}</span>
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
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Known Network</h3>
            <div className="space-y-1">
              {knownNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg can-hover:hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {network.connected && <Check className="w-4 h-4 text-foreground" />}
                    <span className="text-xs">{network.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <WifiSignal className="text-muted-foreground" />
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
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Other Networks</h3>
            <div className="space-y-1">
              {otherNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg can-hover:hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs">{network.name}</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <WifiSignal className="text-muted-foreground" />
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
