"use client";

import { format, parseISO } from "date-fns";
import NewNote from "./new-note";
import { Input } from "./ui/input";

export default function NewNoteHeader({
  note,
  setTitle,
}: {
  note: any;
  setTitle: (title: string) => void;
}) {
  const formattedDate = format(
    parseISO(note.created_at),
    "MMMM d, yyyy 'at' h:mma"
  );

  return (
    <div className="bg-[#1e1e1e] mb-4">
      <p className="text-center text-muted-foreground text-xs">{formattedDate}</p>
      <div className="flex items-center justify-between">
        <Input
          className="placeholder:text-muted-foreground text-lg font-bold"
          placeholder="Your title here..."
          onChange={(e) => setTitle(e.target.value)}
        />
        <NewNote />
      </div>
    </div>
  );
}
