"use client";

import { useState } from "react";
import { Bluetooth, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const myDevices = [
  { name: "Nothing Headphones", connected: true },
  { name: "Alana's AirPods Max", connected: false },
  { name: "Alana's AirPods Pro", connected: false },
  { name: "Flipper Reg0l1", connected: false },
  { name: "Matic-Robot-07m-53jp", connected: false },
  { name: "Porsche BT 1524", connected: false },
];

interface BluetoothPanelProps {
  isMobile?: boolean;
}

export function BluetoothPanel({ isMobile = false }: BluetoothPanelProps) {
  const [isEnabled, setIsEnabled] = useState(true);

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
              onClick={() => setIsEnabled(!isEnabled)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                isEnabled ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
                  isEnabled ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Discoverable note */}
        <p className="text-sm text-muted-foreground px-2">
          This iPhone is discoverable as "alana's iphone" while Bluetooth Settings is open.
        </p>

        {/* My Devices section */}
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide px-2 mb-2">
            My Devices
          </p>
          <div className="rounded-xl bg-background overflow-hidden">
            {myDevices.map((device, index) => (
              <div
                key={device.name}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  index < myDevices.length - 1 && "border-b border-border/50"
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

  // Desktop layout
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Bluetooth</span>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={cn(
              "w-10 h-6 rounded-full transition-colors relative",
              isEnabled ? "bg-green-500" : "bg-gray-300"
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
      </div>
    </div>
  );
}
