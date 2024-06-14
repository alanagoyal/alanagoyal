import { Textarea } from "./ui/textarea";
import MainHeader from "./main-header";

export default function Notepad() {
  return (
    <div>
      <MainHeader />
      <Textarea className="bg-[#1e1e1e] h-full">
        hi, welcome to my website/notepad
      </Textarea>
    </div>
  );
}
