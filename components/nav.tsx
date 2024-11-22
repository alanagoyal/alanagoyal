import { Icons } from "./icons";

export function Nav() {
  return (
    <div className="h-12 bg-background border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <button className="p-2 hover:bg-muted rounded-full">
        <Icons.new />
      </button>
    </div>
  );
}
