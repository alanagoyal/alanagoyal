import type { SidebarItem } from "./finder-app";

interface IndexEntry {
  name: string;
  type: "file" | "dir" | "app";
  path: string;
  icon?: string;
  nameLower: string;
  section: SidebarItem;
  charBitmap: number;
}

interface SearchOptions {
  query: string;
  scope: "current" | "all";
  section?: SidebarItem;
}

export interface SearchResult {
  entry: IndexEntry;
  score: number;
  matchPositions: number[];
}

export type EntryInput = { name: string; type: "file" | "dir" | "app"; path: string; icon?: string; section: SidebarItem };

function charBitmap(s: string): number {
  let b = 0;
  for (let i = 0; i < s.length; i++) b |= 1 << ((s.charCodeAt(i) - 97) & 31);
  return b;
}

const SEPARATORS = new Set(["/", ".", "-", "_", " "]);

function fuzzyMatch(query: string, target: string): { score: number; positions: number[] } | null {
  if (query.length > target.length) return null;

  const positions: number[] = [];
  let qi = 0;
  let score = 0;
  let consecutive = 0;

  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      positions.push(ti);
      score += ti === 0 ? 15 : SEPARATORS.has(target[ti - 1]) ? 10 : 1;

      if (positions.length > 1 && positions[positions.length - 2] === ti - 1) {
        consecutive++;
        score += consecutive * 5;
      } else {
        consecutive = 0;
      }
      qi++;
    }
  }

  if (qi < query.length) return null;

  score += Math.max(0, 50 - (positions[positions.length - 1] - positions[0]));
  score += Math.max(0, 30 - target.length);
  return { score, positions };
}

function toIndexEntry(e: EntryInput): IndexEntry {
  const nameLower = e.name.toLowerCase();
  return { name: e.name, type: e.type, path: e.path, icon: e.icon, nameLower, section: e.section, charBitmap: charBitmap(nameLower) };
}

export class FinderSearchEngine {
  private index: IndexEntry[] = [];
  private indexedPaths = new Set<string>();
  version = 0;

  buildIndex(entries: EntryInput[]): void {
    this.indexedPaths.clear();
    this.index = [];
    for (const e of entries) {
      if (this.indexedPaths.has(e.path)) continue;
      this.indexedPaths.add(e.path);
      this.index.push(toIndexEntry(e));
    }
    this.version++;
  }

  addEntries(entries: EntryInput[]): void {
    for (const e of entries) {
      if (this.indexedPaths.has(e.path)) continue;
      this.indexedPaths.add(e.path);
      this.index.push(toIndexEntry(e));
    }
    this.version++;
  }

  search(options: SearchOptions): SearchResult[] {
    const { query, scope, section } = options;
    if (!query) return [];

    const q = query.toLowerCase();
    const qBitmap = charBitmap(q);
    const candidates = (scope === "current" && section)
      ? this.index.filter((e) => e.section === section)
      : this.index;

    const results: SearchResult[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const entry = candidates[i];
      if ((qBitmap & entry.charBitmap) !== qBitmap) continue;

      const m = fuzzyMatch(q, entry.nameLower);
      if (m) {
        results.push({ entry, score: m.score, matchPositions: m.positions });
      }
    }

    results.sort((a, b) => b.score - a.score);
    if (results.length > 500) results.length = 500;
    return results;
  }
}
