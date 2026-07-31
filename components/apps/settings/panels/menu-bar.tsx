"use client";

import { Switch } from "@/components/ui/switch";
import { useSystemSettings } from "@/lib/system-settings-context";

export function MenuBarPanel() {
  const { clockShowSeconds, setClockShowSeconds } = useSystemSettings();

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-5 text-center">
        <h1 className="text-base font-semibold">Menu Bar</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose how the clock appears in the menu bar.
        </p>
      </div>

      <section aria-labelledby="clock-options-heading">
        <h2
          id="clock-options-heading"
          className="mb-2 px-1 text-xs font-medium text-muted-foreground"
        >
          Clock Options
        </h2>
        <div className="rounded-xl bg-muted/60">
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Display the time with seconds
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Show the time as hours, minutes, and seconds.
              </p>
            </div>
            <Switch
              aria-label="Display the time with seconds"
              checked={clockShowSeconds}
              onCheckedChange={setClockShowSeconds}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
