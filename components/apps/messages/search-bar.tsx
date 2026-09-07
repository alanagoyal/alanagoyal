import { useEffect, useRef, type RefObject } from "react";
import { Icons } from "./icons";
import { useWindowFocus } from "@/lib/window-focus-context";

interface SearchBarProps {
  inputRef: RefObject<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ inputRef, value, onChange }: SearchBarProps) {
  const justBlurred = useRef(false);
  const windowFocus = useWindowFocus();

  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      // Check if this app should handle the shortcut
      // In desktop mode (windowFocus exists), check if this window is focused
      // In standalone mode, check if target is within this app
      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-app="messages"]')) return;
      }

      if (e.key === "Escape") {
        if (
          document.activeElement !== inputRef.current &&
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
  }, [inputRef, value, onChange, windowFocus]);

  return (
    <div className="p-2">
      <div className="relative">
        <Icons.search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
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
          aria-label="Search messages"
          className="w-full pl-8 pr-8 py-0.5 rounded-lg text-base desktop:text-sm placeholder:text-sm placeholder:text-muted-foreground focus:outline-none bg-[#E8E8E7] dark:bg-[#353533]"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground can-hover:hover:text-foreground"
            aria-label="Clear search"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
