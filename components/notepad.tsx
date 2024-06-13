import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import Sidebar from "./sidebar";

export default function Notepad() {
  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-5">
          <div className="bg-[#1e1e1e] pb-4 mb-4">
            <Input placeholder="Alana's notes" />
            <p className="text-gray-400">March 4, 2024 at 5:35 PM</p>
          </div>
          <Textarea className="bg-[#1e1e1e] h-full">
            hi, welcome to my website/notepad
          </Textarea>
        </main>
      </div>
    </div>
  );
}
