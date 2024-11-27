import { Icons } from "./icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <Icons.search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          className="w-full pl-8 pr-3 py-1.5 bg-muted/50 rounded-lg text-base sm:text-sm placeholder:text-sm focus:outline-none bg-transparent border dark:border-foreground/20"
        />
      </div>
    </div>
  );
}
