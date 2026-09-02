"use client";

import { useSystemSettings } from "@/lib/system-settings-context";
import { SettingsSwitch } from "../settings-switch";

export function DesktopDockPanel() {
  const { showDockIndicators, setShowDockIndicators } = useSystemSettings();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
      <h2 className="text-sm font-semibold">Dock</h2>
      <div className="rounded-xl bg-muted/60 text-sm">
        <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
          <span>Show indicators for open applications</span>
          <SettingsSwitch
            aria-label="Show indicators for open applications"
            checked={showDockIndicators}
            onCheckedChange={setShowDockIndicators}
          />
        </div>
      </div>
    </div>
  );
}
