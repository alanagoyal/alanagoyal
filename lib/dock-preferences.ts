import type { AppConfig } from "@/types/apps";

export const DOCK_KEEP_OVERRIDES_STORAGE_KEY = "desktopDockKeepOverrides";

export type DockKeepOverrides = Record<string, boolean>;

export function parseDockKeepOverrides(value: string | null): DockKeepOverrides {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([appId, shouldKeep]) => appId.length > 0 && typeof shouldKeep === "boolean"
      )
    );
  } catch {
    return {};
  }
}

export function isAppKeptInDock(
  app: Pick<AppConfig, "id" | "showOnDockByDefault">,
  overrides: DockKeepOverrides
): boolean {
  if (app.id === "finder") return true;
  return overrides[app.id] ?? app.showOnDockByDefault !== false;
}

export function setAppKeptInDock(
  overrides: DockKeepOverrides,
  app: Pick<AppConfig, "id" | "showOnDockByDefault">,
  shouldKeep: boolean
): DockKeepOverrides {
  if (app.id === "finder") return overrides;

  const defaultValue = app.showOnDockByDefault !== false;
  const next = { ...overrides };

  if (shouldKeep === defaultValue) {
    delete next[app.id];
  } else {
    next[app.id] = shouldKeep;
  }

  return next;
}
