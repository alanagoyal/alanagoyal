import type { Heading, Root, RootContent } from "mdast";

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

export function getCollapsibleSectionKey(
  level: number,
  heading: string,
  occurrence = 1,
): string {
  const baseKey = `${level}:${heading.trim().replace(/\s+/g, " ").toLowerCase()}`;
  return occurrence > 1 ? `${baseKey}:${occurrence}` : baseKey;
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

type CollapsibleSectionNode = {
  type: "notesCollapsibleSection";
  children: RootContent[];
  data: {
    hName: "section";
    hProperties: Record<string, unknown>;
  };
};

type TextBearingNode = {
  type: string;
  value?: string;
  alt?: string | null;
  children?: TextBearingNode[];
};

function getNodeText(node: TextBearingNode): string {
  if (typeof node.value === "string") return node.value;
  if (typeof node.alt === "string") return node.alt;
  return node.children?.map(getNodeText).join("") ?? "";
}

function getPrimaryCollapsibleHeadingLevel(children: RootContent[]): number | null {
  const headingCounts = new Map<number, number>();

  for (const child of children) {
    if (child.type !== "heading") continue;
    headingCounts.set(child.depth, (headingCounts.get(child.depth) ?? 0) + 1);
  }

  for (let level = 1; level <= 6; level += 1) {
    if ((headingCounts.get(level) ?? 0) >= 2) return level;
  }

  for (let level = 1; level <= 6; level += 1) {
    if (headingCounts.has(level)) return level;
  }

  return null;
}

function withCollapsibleHeadingData(heading: Heading): Heading {
  const existingProperties =
    heading.data?.hProperties && typeof heading.data.hProperties === "object"
      ? heading.data.hProperties
      : {};

  return {
    ...heading,
    data: {
      ...heading.data,
      hProperties: {
        ...existingProperties,
        "data-collapsible-heading": "",
        "data-heading-level": String(heading.depth),
      },
    },
  };
}

/**
 * Groups root-level Markdown sections in one syntax tree so document-scoped
 * constructs, including reference links and footnotes, keep their semantics.
 */
export function remarkCollapsibleSections() {
  return (tree: Root): void => {
    const targetLevel = getPrimaryCollapsibleHeadingLevel(tree.children);
    if (!targetLevel) return;

    const output: RootContent[] = [];
    const occurrences = new Map<string, number>();
    let activeSection: {
      heading: Heading;
      sectionKey: string;
      children: RootContent[];
    } | null = null;

    const closeSection = () => {
      if (!activeSection) return;

      const sectionNode: CollapsibleSectionNode = {
        type: "notesCollapsibleSection",
        children: [
          withCollapsibleHeadingData(activeSection.heading),
          ...activeSection.children,
        ],
        data: {
          hName: "section",
          hProperties: {
            "data-collapsible-section": "",
            "data-section-key": activeSection.sectionKey,
          },
        },
      };

      output.push(sectionNode as unknown as RootContent);
      activeSection = null;
    };

    for (const child of tree.children) {
      if (child.type === "heading" && child.depth <= targetLevel) {
        closeSection();

        if (child.depth === targetLevel) {
          const headingText = getNodeText(child as TextBearingNode).trim() || "section";
          const baseKey = getCollapsibleSectionKey(child.depth, headingText);
          const occurrence = (occurrences.get(baseKey) ?? 0) + 1;
          occurrences.set(baseKey, occurrence);
          activeSection = {
            heading: child,
            sectionKey: getCollapsibleSectionKey(child.depth, headingText, occurrence),
            children: [],
          };
        } else {
          output.push(child);
        }
        continue;
      }

      if (activeSection) activeSection.children.push(child);
      else output.push(child);
    }

    closeSection();
    tree.children = output;
  };
}
