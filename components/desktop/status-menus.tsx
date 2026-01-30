"use client";

import { useRef, useState } from "react";
import {
  Wifi,
  Lock,
  ChevronRight,
  Bluetooth,
  Sun,
  Volume2,
  Battery,
  Smartphone,
  Moon,
  BedDouble,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings, FocusMode } from "@/lib/system-settings-context";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

// AirDrop icon (concentric arcs)
function AirDropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 18a6 6 0 0 0 0-12" />
      <path d="M12 14a2 2 0 0 0 0-4" />
      <path d="M12 22a10 10 0 0 0 0-20" />
    </svg>
  );
}

// Shared menu container style - matching Apple menu exactly
const menuContainerClass = "absolute top-7 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl shadow-2xl border border-black/10 dark:border-white/10 py-1 z-[70] overflow-hidden";

// Small toggle switch component
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "w-8 h-5 rounded-full transition-colors relative shrink-0",
        enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-3.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t border-black/10 dark:border-white/10" />;
}

// Battery Menu
interface BatteryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function BatteryMenu({ isOpen, onClose, onOpenSettings }: BatteryMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className={cn(menuContainerClass, "w-56")} style={{ right: "130px" }}>
      {/* Battery header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold">Battery</span>
        <span className="text-xs">97%</span>
      </div>

      <div className="px-3 py-1">
        <span className="text-xs text-muted-foreground">Power Source: Battery</span>
      </div>

      <MenuDivider />

      {/* Energy Mode */}
      <div className="px-3 py-1">
        <span className="text-xs font-medium text-muted-foreground">Energy Mode</span>
      </div>

      <button
        onClick={() => setLowPowerMode(!lowPowerMode)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors group"
      >
        <div className={cn(
          "flex items-center justify-center w-6 h-6 rounded",
          lowPowerMode ? "bg-yellow-500" : "bg-gray-200 dark:bg-gray-700"
        )}>
          <Battery className={cn("w-4 h-4", lowPowerMode ? "text-white" : "text-gray-600 dark:text-gray-300")} />
        </div>
        <span className="text-xs">Low Power</span>
      </button>

      <MenuDivider />

      <div className="px-3 py-1.5">
        <span className="text-xs text-muted-foreground">No Apps Using Significant Energy</span>
      </div>

    </div>
  );
}

// Other networks from desktop settings
const otherNetworks = [
  { name: "DIRECT-7A-HP OfficeJet Pro 9730e" },
  { name: "Xfinity Wifi" },
  { name: "Xfinity Mobile" },
];

// Wi-Fi Menu
interface WifiMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWifiSettings?: () => void;
}

export function WifiMenu({ isOpen, onClose, onOpenWifiSettings }: WifiMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { wifiEnabled, setWifiEnabled } = useSystemSettings();
  const [showOtherNetworks, setShowOtherNetworks] = useState(false);

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className={cn(menuContainerClass, "w-56")} style={{ right: "100px" }}>
      {/* Wi-Fi header with toggle */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold">Wi-Fi</span>
        <Toggle enabled={wifiEnabled} onChange={setWifiEnabled} />
      </div>

      {wifiEnabled && (
        <>
          <MenuDivider />

          {/* Personal Hotspot */}
          <div className="px-3 py-1">
            <span className="text-xs font-semibold text-muted-foreground">Personal Hotspot</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
              <Smartphone className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs flex-1">alana&apos;s iphone</span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-white/70">
              <div className="flex items-end gap-px h-2.5">
                <div className="w-0.5 h-1 bg-current rounded-full" />
                <div className="w-0.5 h-1.5 bg-current rounded-full" />
                <div className="w-0.5 h-2 bg-current rounded-full" />
                <div className="w-0.5 h-2.5 bg-current rounded-full" />
              </div>
              <span className="text-xs ml-0.5">5G</span>
            </div>
          </div>

          <MenuDivider />

          {/* Known Network */}
          <div className="px-3 py-1">
            <span className="text-xs font-semibold text-muted-foreground">Known Network</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
              <Wifi className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs flex-1">basecase</span>
            <Lock className="w-3 h-3 text-muted-foreground group-hover:text-white/70" />
          </div>

          <MenuDivider />

          {/* Other Networks */}
          <button
            onClick={() => setShowOtherNetworks(!showOtherNetworks)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-blue-500 hover:text-white transition-colors group"
          >
            <span>Other Networks</span>
            <ChevronRight className={cn(
              "w-3 h-3 text-muted-foreground group-hover:text-white/70 transition-transform",
              showOtherNetworks && "rotate-90"
            )} />
          </button>

          {showOtherNetworks && (
            <div className="pl-2">
              {otherNetworks.map((network) => (
                <div
                  key={network.name}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer group"
                >
                  <Wifi className="w-3 h-3 text-muted-foreground group-hover:text-white/70" />
                  <span className="text-xs flex-1 truncate">{network.name}</span>
                  <Lock className="w-3 h-3 text-muted-foreground group-hover:text-white/70" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <MenuDivider />

      <button
        onClick={() => {
          onOpenWifiSettings?.();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-xs text-left hover:bg-blue-500 hover:text-white transition-colors"
      >
        Wi-Fi Settings...
      </button>
    </div>
  );
}

// Control Center Menu
interface ControlCenterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

// Focus mode display names and icons
const focusModeConfig: Record<Exclude<FocusMode, "off">, { name: string; icon: React.ReactNode }> = {
  doNotDisturb: { name: "Do Not Disturb", icon: <Moon className="w-4 h-4" /> },
  sleep: { name: "Sleep", icon: <BedDouble className="w-4 h-4" /> },
  reduceInterruptions: { name: "Reduce Interruptions", icon: <SlidersHorizontal className="w-4 h-4" /> },
};

export function ControlCenterMenu({ isOpen, onClose, onOpenSettings }: ControlCenterMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showFocusMenu, setShowFocusMenu] = useState(false);
  const { brightness, setBrightness, volume, setVolume, wifiEnabled, setWifiEnabled, bluetoothEnabled, setBluetoothEnabled, airdropMode, setAirdropMode, focusMode, setFocusMode } = useSystemSettings();

  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  const toggleAirdrop = () => {
    setAirdropMode(airdropMode === "contacts" ? "everyone" : "contacts");
  };

  const handleFocusSelect = (mode: FocusMode) => {
    // If clicking the active mode, turn it off; otherwise set the new mode
    setFocusMode(focusMode === mode ? "off" : mode);
    setShowFocusMenu(false);
  };

  return (
    <div ref={menuRef} className={cn(menuContainerClass, "w-64 p-2 overflow-visible")} style={{ right: "70px" }}>
      {/* Wi-Fi & Bluetooth row */}
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        {/* Wi-Fi tile */}
        <button
          onClick={() => setWifiEnabled(!wifiEnabled)}
          className="flex items-center gap-2 p-2 rounded-md transition-colors bg-black/5 dark:bg-white/10"
        >
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full",
            wifiEnabled ? "bg-blue-500" : "bg-black/10 dark:bg-white/10"
          )}>
            <Wifi className={cn("w-3.5 h-3.5", wifiEnabled ? "text-white" : "")} />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium truncate">Wi-Fi</div>
            <div className="text-[10px] truncate text-muted-foreground">
              {wifiEnabled ? "basecase" : "Off"}
            </div>
          </div>
        </button>

        {/* Bluetooth tile */}
        <button
          onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
          className="flex items-center gap-2 p-2 rounded-md transition-colors bg-black/5 dark:bg-white/10"
        >
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full",
            bluetoothEnabled ? "bg-blue-500" : "bg-black/10 dark:bg-white/10"
          )}>
            <Bluetooth className={cn("w-3.5 h-3.5", bluetoothEnabled ? "text-white" : "")} />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium truncate">Bluetooth</div>
            <div className="text-[10px] truncate text-muted-foreground">
              {bluetoothEnabled ? "On" : "Off"}
            </div>
          </div>
        </button>
      </div>

      {/* AirDrop & Focus row */}
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        {/* AirDrop tile */}
        <button
          onClick={toggleAirdrop}
          className="flex items-center gap-2 p-2 rounded-md transition-colors bg-black/5 dark:bg-white/10"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
            <AirDropIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium truncate">AirDrop</div>
            <div className="text-[10px] truncate text-muted-foreground">
              {airdropMode === "contacts" ? "Contacts Only" : "Everyone"}
            </div>
          </div>
        </button>

        {/* Focus tile */}
        <div className="relative">
          <button
            onClick={() => setShowFocusMenu(!showFocusMenu)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md transition-colors bg-black/5 dark:bg-white/10 w-full",
              focusMode !== "off" && "bg-purple-500/20 dark:bg-purple-500/30"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full",
              focusMode !== "off" ? "bg-purple-500" : "bg-black/10 dark:bg-white/10"
            )}>
              <Moon className={cn("w-3.5 h-3.5", focusMode !== "off" ? "text-white" : "")} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-medium truncate">Focus</div>
              <div className="text-[10px] truncate text-muted-foreground">
                {focusMode === "off" ? "Off" : focusModeConfig[focusMode].name}
              </div>
            </div>
          </button>

          {/* Focus submenu */}
          {showFocusMenu && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl rounded-md shadow-lg border border-black/10 dark:border-white/10 py-1 z-10">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Focus</div>
              {(Object.keys(focusModeConfig) as Exclude<FocusMode, "off">[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleFocusSelect(mode)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-blue-500 hover:text-white transition-colors",
                    focusMode === mode && "bg-purple-500/20 dark:bg-purple-500/30"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full",
                    focusMode === mode ? "bg-purple-500 text-white" : "bg-black/10 dark:bg-white/10"
                  )}>
                    {focusModeConfig[mode].icon}
                  </div>
                  <span className="text-xs">{focusModeConfig[mode].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display slider */}
      <div className="bg-black/5 dark:bg-white/10 rounded-md p-2 mb-1.5">
        <div className="text-xs font-medium mb-1.5">Display</div>
        <div className="flex items-center gap-2">
          <Sun className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1 h-1 bg-black/10 dark:bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          />
          <Sun className="w-4 h-4 shrink-0" />
        </div>
      </div>

      {/* Sound slider */}
      <div className="bg-black/5 dark:bg-white/10 rounded-md p-2">
        <div className="text-xs font-medium mb-1.5">Sound</div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-1 bg-black/10 dark:bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
          />
          <Volume2 className="w-4 h-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}
