export const SHELL_POINTER_MEDIA_QUERY = "(pointer: coarse)";
export const SHELL_DEFAULT_APP_ID = "notes";
export const SHELL_DEFAULT_NOTE_SLUG = "about-me";
export const SHELL_NOTES_ROOT_PATH = "/notes";

const APP_ROUTE_PREFIXES = [
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
] as const;

type ShellContext = "desktop" | "mobile";

interface ShellUrlOptions {
  context?: ShellContext;
  noteSlug?: string;
  currentPathname?: string;
  filePath?: string;
}

interface ParsedShellLocation {
  normalizedPathname: string;
  appId: string;
  noteSlug?: string;
  filePath?: string;
}

interface ParseShellLocationOptions {
  fallbackAppId?: string;
  context?: ShellContext;
}

const FILE_QUERY_PARAM_APPS = new Set(["textedit", "preview"]);
const MOBILE_APP_REDIRECTS: Record<string, string> = {
  textedit: "finder",
  preview: "finder",
};

export function normalizeShellPathname(pathname: string): string {
  return pathname === "/" ? SHELL_NOTES_ROOT_PATH : pathname;
}

export function isNotesDetailPathname(pathname: string): boolean {
  return pathname.startsWith(`${SHELL_NOTES_ROOT_PATH}/`);
}

export function getShellAppIdFromPathname(pathname: string, fallbackAppId = SHELL_DEFAULT_APP_ID): string {
  const normalizedPathname = normalizeShellPathname(pathname);
  const routeMatch = APP_ROUTE_PREFIXES.find(({ prefix }) => normalizedPathname.startsWith(prefix));
  return routeMatch?.appId ?? fallbackAppId;
}

export function getNoteSlugFromShellPathname(pathname: string): string | undefined {
  if (!isNotesDetailPathname(pathname)) return undefined;

  const slug = pathname.slice(`${SHELL_NOTES_ROOT_PATH}/`.length).split("/")[0];
  if (!slug) return undefined;

  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getNotesRoute(noteSlug = SHELL_DEFAULT_NOTE_SLUG): string {
  return `${SHELL_NOTES_ROOT_PATH}/${encodeURIComponent(noteSlug)}`;
}

export function getShellAppIdForContext(appId: string, context: ShellContext = "desktop"): string {
  if (context === "mobile") {
    return MOBILE_APP_REDIRECTS[appId] ?? appId;
  }
  return appId;
}

export function getShellUrlForApp(appId: string, options: ShellUrlOptions = {}): string | null {
  const context = options.context ?? "desktop";
  const contextualAppId = getShellAppIdForContext(appId, context);

  if (contextualAppId !== appId) {
    return `/${contextualAppId}`;
  }

  if (appId === "notes") {
    if (context === "mobile") return SHELL_NOTES_ROOT_PATH;

    if (options.currentPathname && isNotesDetailPathname(options.currentPathname)) {
      return options.currentPathname;
    }

    if (options.noteSlug) {
      return getNotesRoute(options.noteSlug);
    }

    return null;
  }

  if (FILE_QUERY_PARAM_APPS.has(appId)) {
    if (!options.filePath) {
      return context === "desktop" ? null : `/${appId}`;
    }

    return `/${appId}?file=${encodeURIComponent(options.filePath)}`;
  }

  return `/${appId}`;
}

export function parseShellLocation(
  pathname: string,
  search: string,
  options: ParseShellLocationOptions = {}
): ParsedShellLocation {
  const context = options.context ?? "desktop";
  const fallbackAppId = getShellAppIdForContext(options.fallbackAppId ?? SHELL_DEFAULT_APP_ID, context);
  const rawNormalizedPathname = normalizeShellPathname(pathname);
  const rawAppId = getShellAppIdFromPathname(rawNormalizedPathname, fallbackAppId);
  const appId = getShellAppIdForContext(rawAppId, context);

  const normalizedPathname = appId === rawAppId
    ? rawNormalizedPathname
    : (getShellUrlForApp(appId, { context }) ?? rawNormalizedPathname);

  const noteSlug = appId === "notes" ? getNoteSlugFromShellPathname(rawNormalizedPathname) : undefined;
  const filePath = appId === rawAppId && FILE_QUERY_PARAM_APPS.has(appId)
    ? (new URLSearchParams(search).get("file") ?? undefined)
    : undefined;

  return {
    normalizedPathname,
    appId,
    noteSlug,
    filePath,
  };
}
