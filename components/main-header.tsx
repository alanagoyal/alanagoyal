import { PlusCircle } from "lucide-react";
import { Input } from "./ui/input";

export default function MainHeader() {
  return (
    <div className="bg-[#1e1e1e] pb-4 mb-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Alana's notes" />
        <PlusCircle className="w-4 h-4" />
      </div>
      <p className="text-gray-4000">March 4, 2024 at 5:35 PM</p>
    </div>
  );
}
