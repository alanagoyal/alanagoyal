import { useEffect, useRef } from "react";
import { Icons } from "./icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const justBlurred = useRef(false);

  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const searchInput = document.querySelector(
          'input[placeholder="Search"]'
        );
        if (
          document.activeElement !== searchInput &&
          value &&
          !justBlurred.current
        ) {
          onChange("");
        }
        justBlurred.current = false;
      }
    };

    window.addEventListener("keydown", handleGlobalEscape);
    return () => window.removeEventListener("keydown", handleGlobalEscape);
  }, [value, onChange]);

  return (
    <div className="py-2">
      <div className="relative">
        <Icons.search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              if (document.activeElement === e.currentTarget) {
                justBlurred.current = true;
                e.currentTarget.blur();
                setTimeout(() => {
                  justBlurred.current = false;
                }, 0);
              }
            }
          }}
          placeholder="Search"
          className="w-full pl-8 pr-8 py-0.5 rounded-lg text-base sm:text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none bg-[#E8E8E7] dark:bg-[#353533]"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
