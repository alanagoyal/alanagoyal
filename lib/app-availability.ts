import { APPS } from "@/lib/app-config";
import type { AppConfig } from "@/types/apps";

export type AvailabilityContext = "desktop" | "mobile";

const DEFAULT_MOBILE_FALLBACK_APP_ID = "notes";
const DEFAULT_MOBILE_ROUTE_REDIRECT = "/notes";

export function getAppConfigOrNull(appId: string): AppConfig | null {
  return APPS.find((app) => app.id === appId) ?? null;
}

export function isAppSupportedOnMobile(appId: string): boolean {
  const app = getAppConfigOrNull(appId);
  return app?.mobile.supported === true;
}

export function getMobileShellFallbackAppId(appId: string): string {
  const app = getAppConfigOrNull(appId);
  if (!app) return DEFAULT_MOBILE_FALLBACK_APP_ID;
  if (app.mobile.supported) return appId;
  return app.mobile.shellFallbackAppId ?? DEFAULT_MOBILE_FALLBACK_APP_ID;
}

export function getMobileDirectRouteRedirect(appId: string): string {
  const app = getAppConfigOrNull(appId);
  if (!app || app.mobile.supported) return DEFAULT_MOBILE_ROUTE_REDIRECT;
  return app.mobile.directRouteRedirectTo;
}

export function isAppVisibleInFinderApplications(app: AppConfig, context: AvailabilityContext): boolean {
  if (app.id === "finder") return false;
  if (app.showInFinderApplications === false) return false;
  if (context === "mobile" && !app.mobile.supported) return false;
  if (context === "mobile" && app.mobile.showInFinderApplications === false) return false;
  return true;
}

export function getFinderVisibleApps(context: AvailabilityContext): AppConfig[] {
  return APPS.filter((app) => isAppVisibleInFinderApplications(app, context));
}
