"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Clock3, PanelTop } from "lucide-react";
import { useSystemSettings } from "@/lib/system-settings-context";
import { SettingsSwitch } from "../settings-switch";

function SwitchRow({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
      <span className={disabled ? "text-muted-foreground" : undefined}>{label}</span>
      <SettingsSwitch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function ClockOptionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    clockShowDate,
    setClockShowDate,
    clockShowDayOfWeek,
    setClockShowDayOfWeek,
    clockStyle,
    setClockStyle,
    clockShowAmPm,
    setClockShowAmPm,
    clockFlashSeparators,
    setClockFlashSeparators,
    clockShowSeconds,
    setClockShowSeconds,
  } = useSystemSettings();
  const isDigital = clockStyle === "digital";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[95] bg-black/30 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[96] w-[min(560px,calc(100vw-32px))] max-h-[calc(100vh-48px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-black/10 bg-background shadow-2xl focus:outline-none">
          <div className="px-7 pb-5 pt-6">
            <Dialog.Title className="text-lg font-semibold">Clock Options</Dialog.Title>
            <Dialog.Description className="sr-only">
              Choose how the date and time appear in the menu bar.
            </Dialog.Description>

            <section className="mt-5" aria-labelledby="clock-date-heading">
              <h2 id="clock-date-heading" className="mb-2 text-sm font-semibold">
                Date
              </h2>
              <div className="divide-y divide-border/50 rounded-xl bg-muted/60 text-sm">
                <SwitchRow
                  label="Show date"
                  checked={clockShowDate}
                  onCheckedChange={setClockShowDate}
                />
                <SwitchRow
                  label="Show the day of the week"
                  checked={clockShowDayOfWeek}
                  onCheckedChange={setClockShowDayOfWeek}
                />
              </div>
            </section>

            <section className="mt-6" aria-labelledby="clock-time-heading">
              <h2 id="clock-time-heading" className="mb-2 text-sm font-semibold">
                Time
              </h2>
              <div className="divide-y divide-border/50 rounded-xl bg-muted/60 text-sm">
                <fieldset className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
                  <legend className="sr-only">Clock style</legend>
                  <span>Style</span>
                  <div className="flex items-center gap-5">
                    {(["digital", "analog"] as const).map((style) => (
                      <label key={style} className="flex items-center gap-2 capitalize">
                        <input
                          type="radio"
                          name="clock-style"
                          value={style}
                          checked={clockStyle === style}
                          onChange={() => setClockStyle(style)}
                          className="h-4 w-4 accent-[#0A7CFF]"
                        />
                        {style}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <SwitchRow
                  label="Show AM/PM"
                  checked={clockShowAmPm}
                  onCheckedChange={setClockShowAmPm}
                  disabled={!isDigital}
                />
                <SwitchRow
                  label="Flash the time separators"
                  checked={clockFlashSeparators}
                  onCheckedChange={setClockFlashSeparators}
                  disabled={!isDigital}
                />
                <SwitchRow
                  label="Display the time with seconds"
                  checked={clockShowSeconds}
                  onCheckedChange={setClockShowSeconds}
                  disabled={!isDigital}
                />
              </div>
            </section>
          </div>

          <div className="flex justify-end border-t border-border/60 px-7 py-4">
            <Dialog.Close asChild>
              <button className="rounded-lg bg-[#0A7CFF] px-5 py-1.5 text-sm font-medium text-white can-hover:hover:bg-[#006EE6]">
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MenuBarPanel() {
  const [clockOptionsOpen, setClockOptionsOpen] = useState(false);
  const {
    menuBarBackground,
    setMenuBarBackground,
    clockStyle,
    clockShowDate,
    clockShowDayOfWeek,
  } = useSystemSettings();
  const clockSummary = [
    clockStyle === "digital" ? "Digital" : "Analog",
    clockShowDate ? "date" : null,
    clockShowDayOfWeek ? "weekday" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-7 p-6">
      <div className="rounded-xl bg-muted/60 text-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <PanelTop className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Show menu bar background</p>
              <p className="text-xs text-muted-foreground">
                Increase contrast behind menu bar items.
              </p>
            </div>
          </div>
          <SettingsSwitch
            aria-label="Show menu bar background"
            checked={menuBarBackground}
            onCheckedChange={setMenuBarBackground}
          />
        </div>
      </div>

      <section aria-labelledby="menu-bar-controls-heading">
        <h2 id="menu-bar-controls-heading" className="mb-3 text-sm font-semibold">
          Menu Bar Controls
        </h2>
        <div className="mb-3 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          System controls can be configured to appear in the menu bar.
        </div>
        <div className="rounded-xl bg-muted/60">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-400 text-white shadow-sm">
                <Clock3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Clock</p>
                <p className="truncate text-xs text-muted-foreground">{clockSummary}</p>
              </div>
            </div>
            <button
              onClick={() => setClockOptionsOpen(true)}
              className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-sm can-hover:hover:bg-muted/80"
            >
              Clock Options&hellip;
            </button>
          </div>
        </div>
      </section>

      <ClockOptionsDialog open={clockOptionsOpen} onOpenChange={setClockOptionsOpen} />
    </div>
  );
}
