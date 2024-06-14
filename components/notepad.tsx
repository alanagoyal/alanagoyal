import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import Sidebar from "./sidebar";
import MainHeader from "./main-header";

export default function Notepad() {
  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-5">
          <MainHeader />
          <Textarea className="bg-[#1e1e1e] h-full">
            hi, welcome to my website/notepad
          </Textarea>
        </main>
      </div>
    </div>
  );
}
