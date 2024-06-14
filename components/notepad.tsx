import { Textarea } from "./ui/textarea";
import MainHeader from "./main-header";

export default function Notepad() {
  function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-US', options).format(date).replace(/,\s(?=\d{1,2}:)/, ' at');
  }
  return (
    <div>
      <MainHeader title="Alana's notes" date={formatDate(new Date())} />
      <Textarea className="bg-[#1e1e1e] h-full">
        hi, welcome to my website/notepad
      </Textarea>
    </div>
  );
}
