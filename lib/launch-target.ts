const DEFAULT_APP_ID = "notes";

const ROUTE_PREFIX_TO_APP: Array<{ prefix: string; appId: string }> = [
  { prefix: "/settings", appId: "settings" },
  { prefix: "/messages", appId: "messages" },
  { prefix: "/notes", appId: "notes" },
  { prefix: "/iterm", appId: "iterm" },
  { prefix: "/finder", appId: "finder" },
  { prefix: "/photos", appId: "photos" },
  { prefix: "/calendar", appId: "calendar" },
  { prefix: "/music", appId: "music" },
  { prefix: "/textedit", appId: "textedit" },
  { prefix: "/preview", appId: "preview" },
];

export function getAppIdFromPathname(pathname: string, fallbackApp?: string): string {
  for (const route of ROUTE_PREFIX_TO_APP) {
    if (pathname.startsWith(route.prefix)) {
      return route.appId;
    }
  }

  return fallbackApp || DEFAULT_APP_ID;
}
