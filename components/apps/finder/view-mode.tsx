export const FINDER_VIEW_MODES = ["icons", "list", "columns", "gallery"] as const;

export type FinderViewMode = (typeof FINDER_VIEW_MODES)[number];

export const FINDER_VIEW_MODE_LABELS: Record<FinderViewMode, string> = {
  icons: "as Icons",
  list: "as List",
  columns: "as Columns",
  gallery: "as Gallery",
};

export function isFinderViewMode(value: unknown): value is FinderViewMode {
  return typeof value === "string" && FINDER_VIEW_MODES.includes(value as FinderViewMode);
}

export function FinderViewModeIcon({
  mode,
  className,
}: {
  mode: FinderViewMode;
  className?: string;
}) {
  if (mode === "icons") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }

  if (mode === "columns") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16M15 4v16" />
      </svg>
    );
  }

  if (mode === "gallery") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="13" rx="2" />
        <path d="M6 20h1M10 20h1M14 20h1M18 20h1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
    </svg>
  );
}
