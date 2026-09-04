export type FinderSortKey = "name" | "kind" | "date";
export type FinderSortDirection = "ascending" | "descending";

export interface FinderSort {
  key: FinderSortKey;
  direction: FinderSortDirection;
}

export function parseFinderSort(value: unknown): FinderSort | null {
  if (!value || typeof value !== "object") return null;
  const { key, direction } = value as Partial<FinderSort>;
  if (
    (key !== "name" && key !== "kind" && key !== "date") ||
    (direction !== "ascending" && direction !== "descending")
  ) {
    return null;
  }
  return { key, direction };
}

export interface FinderSortableEntry {
  name: string;
  displayName?: string;
  kind: string;
  modifiedAt: number;
}

const textCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function getDefaultFinderSort(path: string): FinderSort {
  return path === "recents"
    ? { key: "date", direction: "descending" }
    : { key: "name", direction: "ascending" };
}

export function getNextFinderSort(
  current: FinderSort | null,
  key: FinderSortKey
): FinderSort {
  if (current?.key === key) {
    return {
      key,
      direction:
        current.direction === "ascending" ? "descending" : "ascending",
    };
  }

  return {
    key,
    direction: key === "date" ? "descending" : "ascending",
  };
}

export function sortFinderEntries<T extends FinderSortableEntry>(
  entries: readonly T[],
  sort: FinderSort
): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      let comparison = 0;

      if (sort.key === "name") {
        comparison = textCollator.compare(
          left.entry.displayName ?? left.entry.name,
          right.entry.displayName ?? right.entry.name
        );
      } else if (sort.key === "kind") {
        comparison = textCollator.compare(left.entry.kind, right.entry.kind);
      } else {
        comparison = left.entry.modifiedAt - right.entry.modifiedAt;
      }

      if (comparison !== 0) {
        return sort.direction === "ascending" ? comparison : -comparison;
      }

      const nameComparison = textCollator.compare(
        left.entry.displayName ?? left.entry.name,
        right.entry.displayName ?? right.entry.name
      );
      return nameComparison || left.index - right.index;
    })
    .map(({ entry }) => entry);
}
