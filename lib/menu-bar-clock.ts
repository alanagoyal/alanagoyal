import type { ClockStyle } from "@/lib/system-settings-context";

interface ClockRefreshOptions {
  clockStyle: ClockStyle;
  flashSeparators: boolean;
  showSeconds: boolean;
}

export function getMenuBarClockRefreshMs({
  clockStyle,
  flashSeparators,
  showSeconds,
}: ClockRefreshOptions): number {
  if (clockStyle === "analog") return 60_000;
  if (flashSeparators) return 500;
  if (showSeconds) return 1_000;
  return 60_000;
}

export function getDelayUntilNextClockRefresh(nowMs: number, refreshMs: number): number {
  const elapsedInPeriod = nowMs % refreshMs;
  return elapsedInPeriod === 0 ? refreshMs : refreshMs - elapsedInPeriod;
}
