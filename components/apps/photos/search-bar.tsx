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
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        placeholder="Search photos"
        aria-label="Search photos"
        className="w-full rounded-full bg-[#E8E8E7] py-1.5 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none dark:bg-[#353533]"
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
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground can-hover:hover:text-foreground"
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </div>
  );
}
