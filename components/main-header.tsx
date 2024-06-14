import { PlusCircle } from "lucide-react";
import { Input } from "./ui/input";

export default function MainHeader({ title, date }: { title: string, date: string }) {
  return (
    <div className="bg-[#1e1e1e] pb-4 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{title}</p>
        <PlusCircle className="w-4 h-4" />
      </div>
      <p className="text-muted-foreground text-sm">{date}</p>
    </div>
  );
}
