import { Icons } from "./icons";
import React from 'react';

interface NavProps {
  onNewChat: () => void;
}

export function Nav({ onNewChat }: NavProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or if command/meta key is pressed
      if (document.activeElement?.tagName === 'INPUT' || e.metaKey) {
        return;
      }

      if (e.key === 'n') {
        e.preventDefault();
        onNewChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNewChat]);

  return (
    <div className="h-12 bg-background flex items-center justify-between px-4 bg-muted">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <button 
        className="sm:p-2 hover:bg-muted-foreground/10 rounded-lg"
        onClick={onNewChat}
        aria-label="New conversation (n)"
      >
        <Icons.new />
      </button>
    </div>
  );
}
