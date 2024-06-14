import { PlusCircle } from "lucide-react";
import { format, parseISO } from 'date-fns';

export default function NoteHeader({ title, date }: { title: string, date: string }) {
  const formattedDate = format(parseISO(date), 'MMMM d, yyyy \'at\' h:mma');

  return (
    <div className="bg-[#1e1e1e] pb-4 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{title}</p>
        <PlusCircle className="w-4 h-4" />
      </div>
      <p className="text-muted-foreground text-sm">{formattedDate}</p>
    </div>
  );
}
