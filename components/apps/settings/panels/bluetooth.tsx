"use client";

import { Bluetooth, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/lib/system-settings-context";

// Device type for different icons
type DeviceType = "keyboard" | "trackpad" | "airpods" | "airpods-max" | "headphones";

interface BluetoothDevice {
  name: string;
  connected: boolean;
  battery?: number;
  type: DeviceType;
}

const myDevicesDesktop: BluetoothDevice[] = [
  { name: "Alana's Magic Keyboard", connected: true, battery: 91, type: "keyboard" },
  { name: "Alana's Magic Trackpad", connected: true, battery: 20, type: "trackpad" },
  { name: "Nothing Headphones", connected: false, type: "headphones" },
  { name: "Alana's AirPods Max", connected: false, type: "airpods-max" },
  { name: "Alana's AirPods Pro", connected: false, type: "airpods" },
  { name: "Flipper Reg0l1", connected: false, type: "headphones" },
];

const myDevicesMobile = [
  { name: "Nothing Headphones", connected: true },
  { name: "Alana's AirPods Max", connected: false },
  { name: "Alana's AirPods Pro", connected: false },
  { name: "Flipper Reg0l1", connected: false },
  { name: "Matic-Robot-07m-53jp", connected: false },
  { name: "Porsche BT 1524", connected: false },
];

// Device icon component
function DeviceIcon({ type, className }: { type: DeviceType; className?: string }) {
  switch (type) {
    case "keyboard":
      return (
        <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="10" width="24" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="7" y="13" width="3" height="2" rx="0.5" fill="currentColor" />
          <rect x="11" y="13" width="3" height="2" rx="0.5" fill="currentColor" />
          <rect x="15" y="13" width="3" height="2" rx="0.5" fill="currentColor" />
          <rect x="19" y="13" width="3" height="2" rx="0.5" fill="currentColor" />
          <rect x="23" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="7" y="17" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="10" y="17" width="12" height="2" rx="0.5" fill="currentColor" />
          <rect x="23" y="17" width="2" height="2" rx="0.5" fill="currentColor" />
        </svg>
      );
    case "trackpad":
      return (
        <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none">
          <rect x="6" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="6" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "airpods":
      return (
        <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none">
          <path d="M10 10C10 8 11 6 13 6C15 6 16 8 16 10V18C16 20 15 22 13 22C11 22 10 20 10 18V10Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M22 10C22 8 21 6 19 6C17 6 16 8 16 10V18C16 20 17 22 19 22C21 22 22 20 22 18V10Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="13" y1="22" x2="13" y2="26" stroke="currentColor" strokeWidth="1.5" />
          <line x1="19" y1="22" x2="19" y2="26" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "airpods-max":
      return (
        <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none">
          <path d="M8 14C8 10 11 6 16 6C21 6 24 10 24 14" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="6" y="14" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="20" y="14" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "headphones":
    default:
      return (
        <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none">
          <path d="M8 16C8 11 11 6 16 6C21 6 24 11 24 16" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="6" y="16" width="5" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="21" y="16" width="5" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
}

// Battery indicator component
function BatteryIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative w-6 h-3 border border-current rounded-sm">
        <div
          className={cn(
            "absolute left-0.5 top-0.5 bottom-0.5 rounded-sm",
            level > 20 ? "bg-current" : "bg-red-500"
          )}
          style={{ width: `${Math.max(0, level - 10)}%` }}
        />
      </div>
      <span className="text-[10px]">{level}%</span>
    </div>
  );
}

interface BluetoothPanelProps {
  isMobile?: boolean;
}

export function BluetoothPanel({ isMobile = false }: BluetoothPanelProps) {
  const { bluetoothEnabled, setBluetoothEnabled } = useSystemSettings();

  if (isMobile) {
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Header card */}
        <div className="rounded-xl bg-background p-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 mb-3">
            <Bluetooth className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">Bluetooth</h1>
          <p className="text-sm text-muted-foreground">
            Connect to accessories you can use for activities such as streaming music, making phone calls, and gaming.{" "}
            <span className="text-blue-500">Learn more...</span>
          </p>

          {/* Bluetooth toggle */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
            <span className="text-base">Bluetooth</span>
            <button
              onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                bluetoothEnabled ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
                  bluetoothEnabled ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Discoverable note */}
        <p className="text-sm text-muted-foreground px-2">
          This iPhone is discoverable as &quot;alana&apos;s iphone&quot; while Bluetooth Settings is open.
        </p>

        {/* My Devices section */}
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide px-2 mb-2">
            My Devices
          </p>
          <div className="rounded-xl bg-background overflow-hidden">
            {myDevicesMobile.map((device, index) => (
              <div
                key={device.name}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  index < myDevicesMobile.length - 1 && "border-b border-border/50"
                )}
              >
                <span className="text-base">{device.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm",
                    device.connected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {device.connected ? "Connected" : "Not Connected"}
                  </span>
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                    <span className="text-blue-500 text-xs font-medium">i</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (macOS style)
  return (
    <div className="max-w-2xl">
      {/* Header section with toggle */}
      <div className="flex items-start gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 shrink-0">
          <Bluetooth className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Bluetooth</span>
            <button
              onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
              className={cn(
                "w-10 h-6 rounded-full transition-colors relative shrink-0",
                bluetoothEnabled ? "bg-blue-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  bluetoothEnabled ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connect to accessories you can use for activities such as streaming music, typing, and gaming.{" "}
            <span className="text-blue-500 cursor-pointer hover:underline">Learn more...</span>
          </p>
        </div>
      </div>

      {bluetoothEnabled && (
        <>
          {/* Discoverable text */}
          <p className="text-xs text-muted-foreground py-4 border-b border-border/50">
            This Mac is discoverable as &quot;Alana&apos;s MacBook Air&quot; while Bluetooth Settings is open.
          </p>

          {/* My Devices section */}
          <div className="py-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">My Devices</h3>
            <div className="space-y-1">
              {myDevicesDesktop.map((device) => (
                <div
                  key={device.name}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <DeviceIcon type={device.type} className="text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs">{device.name}</span>
                      <span className={cn(
                        "text-[10px]",
                        device.connected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {device.connected ? (
                          <span className="flex items-center gap-2">
                            Connected
                            {device.battery !== undefined && (
                              <>
                                <span className="text-muted-foreground">-</span>
                                <BatteryIndicator level={device.battery} />
                              </>
                            )}
                          </span>
                        ) : (
                          "Not Connected"
                        )}
                      </span>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
