const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const ATX_HEADING_PATTERN = /^ {0,3}(#{1,6})(?:[\t ]+|$)/;
const COLLAPSED_SECTIONS_STORAGE_KEY = "notes-collapsed-sections";

type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type CollapsedSectionState = Record<string, string[]>;

function getSessionStorage(storage?: StorageArea): StorageArea | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function loadState(storage: StorageArea): CollapsedSectionState {
  try {
    const saved = storage.getItem(COLLAPSED_SECTIONS_STORAGE_KEY);
    if (!saved) return {};

    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].every((value) => typeof value === "string"),
      ),
    );
  } catch {
    return {};
  }
}

export function getCollapsibleSectionKey(level: number, heading: string): string {
  return `${level}:${heading.trim().replace(/\s+/g, " ").toLocaleLowerCase()}`;
}

export function loadCollapsedSection(
  noteId: string,
  sectionKey: string,
  storage?: StorageArea,
): boolean {
  const target = getSessionStorage(storage);
  if (!target) return false;

  return loadState(target)[noteId]?.includes(sectionKey) ?? false;
}

export function saveCollapsedSection(
  noteId: string,
  sectionKey: string,
  collapsed: boolean,
  storage?: StorageArea,
): void {
  const target = getSessionStorage(storage);
  if (!target) return;

  try {
    const state = loadState(target);
    const sections = new Set(state[noteId] ?? []);

    if (collapsed) sections.add(sectionKey);
    else sections.delete(sectionKey);

    if (sections.size > 0) state[noteId] = [...sections];
    else delete state[noteId];

    if (Object.keys(state).length > 0) {
      target.setItem(COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(state));
    } else {
      target.removeItem(COLLAPSED_SECTIONS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (for example, private browsing restrictions).
  }
}

export function clearCollapsedSections(storage?: StorageArea): void {
  const target = getSessionStorage(storage);
  if (!target) return;

  try {
    target.removeItem(COLLAPSED_SECTIONS_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function getPrimaryCollapsibleHeadingLevel(
  markdown: string,
): number | null {
  const headingCounts = new Map<number, number>();
  let activeFence: { marker: string; length: number } | null = null;

  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const marker = fence[0];

      if (!activeFence) {
        activeFence = { marker, length: fence.length };
      } else if (
        marker === activeFence.marker &&
        fence.length >= activeFence.length
      ) {
        activeFence = null;
      }
      continue;
    }

    if (activeFence) continue;

    const headingMatch = line.match(ATX_HEADING_PATTERN);
    if (!headingMatch) continue;

    const level = headingMatch[1].length;
    headingCounts.set(level, (headingCounts.get(level) ?? 0) + 1);
  }

  for (let level = 1; level <= 6; level += 1) {
    if ((headingCounts.get(level) ?? 0) >= 2) return level;
  }

  for (let level = 1; level <= 6; level += 1) {
    if (headingCounts.has(level)) return level;
  }

  return null;
}
