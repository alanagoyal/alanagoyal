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

const FILE_QUERY_PARAM_APPS = new Set(["textedit", "preview"]);

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

export function getShellUrlForApp(appId: string, options: ShellUrlOptions = {}): string | null {
  const context = options.context ?? "desktop";

  if (appId === "notes") {
    if (context === "mobile") return SHELL_NOTES_ROOT_PATH;

    if (options.currentPathname && isNotesDetailPathname(options.currentPathname)) {
      return options.currentPathname;
    }

    return getNotesRoute(options.noteSlug);
  }

  if (FILE_QUERY_PARAM_APPS.has(appId)) {
    if (!options.filePath) {
      return context === "desktop" ? null : `/${appId}`;
    }

    return `/${appId}?file=${encodeURIComponent(options.filePath)}`;
  }

  return `/${appId}`;
}

export function parseShellLocation(pathname: string, search: string, fallbackAppId = SHELL_DEFAULT_APP_ID): ParsedShellLocation {
  const normalizedPathname = normalizeShellPathname(pathname);
  const appId = getShellAppIdFromPathname(normalizedPathname, fallbackAppId);
  const noteSlug = appId === "notes" ? getNoteSlugFromShellPathname(normalizedPathname) : undefined;
  const filePath = new URLSearchParams(search).get("file") ?? undefined;

  return {
    normalizedPathname,
    appId,
    noteSlug,
    filePath,
  };
}
