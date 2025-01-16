import { Icons } from "./icons";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavProps {
  onNewChat: () => void;
  isMobileView: boolean;
  isScrolled?: boolean;
}

export function Nav({ onNewChat, isMobileView, isScrolled }: NavProps) {
  // Keyboard shortcut for creating a new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input, if command/meta key is pressed,
      // or if the TipTap editor is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        e.metaKey ||
        document.querySelector(".ProseMirror")?.contains(document.activeElement)
      ) {
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        onNewChat();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat]);

  return (
    <>
      <div className={cn(
        "px-4 py-2 flex items-center justify-between sticky top-0 z-[1]",
        isScrolled && "border-b shadow-[0_2px_4px_-1px_rgba(0,0,0,0.15)]",
        isMobileView ? "bg-background" : "bg-muted"
      )}>
        <div className="flex items-center gap-1.5 p-2">
          <button 
            onClick={() => window.close()} 
            className="cursor-pointer group relative"
            aria-label="Close tab"
          >
            <div className="w-3 h-3 rounded-full bg-red-500 group-hover:opacity-80" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none text-xs">
              <span className="text-background">×</span>
            </span>
          </button>
          <a 
            href="https://alanaos.com" 
            aria-label="Visit alanaos.com"
            className="group relative"
          >
            <div className="w-3 h-3 rounded-full bg-yellow-500 group-hover:opacity-80" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none text-xs">
              <span className="text-background">−</span>
            </span>
          </a>
          <button 
            onClick={() => window.location.reload()}
            className="group relative"
            aria-label="Refresh page"
          >
            <div className="w-3 h-3 rounded-full bg-green-500 group-hover:opacity-80" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none text-xs">
              <span className="text-background">+</span>
            </span>
          </button>
        </div>
        <button
          className={`sm:p-2 hover:bg-muted-foreground/10 rounded-lg ${
            isMobileView ? "p-2" : ""
          }`}
          onClick={onNewChat}
          aria-label="New conversation (n)"
        >
          <Icons.new />
        </button>
      </div>
    </>
  );
}
