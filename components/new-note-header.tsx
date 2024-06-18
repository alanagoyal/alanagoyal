"use client";

import { format, parseISO } from "date-fns";
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
    "MMMM d, yyyy 'at' h:mm a"
  );

  return (
    <div className="bg-[#1e1e1e] mb-4">
      <p className="text-center text-muted-foreground text-xs">
        {formattedDate}
      </p>
      <Input
        className="placeholder:text-muted-foreground text-lg font-bold mr-2"
        placeholder="Your title here..."
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
    </div>
  );
}
