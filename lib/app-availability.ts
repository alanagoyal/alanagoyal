import { APPS } from "@/lib/app-config";
import type { AppConfig } from "@/types/apps";

export type AvailabilityContext = "desktop" | "mobile";

const DEFAULT_MOBILE_FALLBACK_APP_ID = "notes";
const DEFAULT_MOBILE_ROUTE_REDIRECT = "/";

export function getAppConfigOrNull(appId: string): AppConfig | null {
  return APPS.find((app) => app.id === appId) ?? null;
}

export function isAppSupportedOnMobile(appId: string): boolean {
  const app = getAppConfigOrNull(appId);
  return app?.mobile?.supported !== false;
}

export function getMobileShellFallbackAppId(appId: string): string {
  const app = getAppConfigOrNull(appId);
  if (!app) return appId;
  if (app.mobile?.supported !== false) return appId;
  return app.mobile.shellFallbackAppId ?? DEFAULT_MOBILE_FALLBACK_APP_ID;
}

export function getMobileDirectRouteRedirect(appId: string): string {
  const app = getAppConfigOrNull(appId);
  return app?.mobile?.directRouteRedirectTo ?? DEFAULT_MOBILE_ROUTE_REDIRECT;
}

export function isAppVisibleInFinderApplications(app: AppConfig, context: AvailabilityContext): boolean {
  if (app.id === "finder") return false;
  if (app.showInFinderApplications === false) return false;
  if (context === "mobile" && app.mobile?.showInFinderApplications === false) return false;
  return true;
}

export function getFinderVisibleApps(context: AvailabilityContext): AppConfig[] {
  return APPS.filter((app) => isAppVisibleInFinderApplications(app, context));
}
