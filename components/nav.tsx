import { Icons } from "./icons";

interface NavProps {
  onNewChat: () => void;
}

export function Nav({ onNewChat }: NavProps) {
  return (
    <div className="h-12 bg-background flex items-center justify-between px-4 bg-muted">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <button 
        className="p-2 hover:bg-muted rounded-lg"
        onClick={onNewChat}
      >
        <Icons.new />
      </button>
    </div>
  );
}
