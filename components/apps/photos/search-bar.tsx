"use client";

import { LoaderCircle, Search, X } from "lucide-react";

interface PhotoSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function PhotoSearchBar({ value, onChange, loading }: PhotoSearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        aria-hidden="true"
        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={14}
      />
      <input
        type="text"
        role="searchbox"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        placeholder="Search photos"
        aria-label="Search photos"
        className="h-8 w-full rounded-full bg-black/[0.06] pl-8 pr-8 text-sm ring-1 ring-inset ring-black/[0.04] placeholder:text-muted-foreground focus:outline-none focus:ring-black/10 dark:bg-white/[0.08] dark:ring-white/[0.06] dark:focus:ring-white/15"
      />
      {loading ? (
        <LoaderCircle
          aria-label="Searching"
          className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
          size={14}
        />
      ) : value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear photo search"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground can-hover:hover:text-foreground"
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </div>
  );
}
