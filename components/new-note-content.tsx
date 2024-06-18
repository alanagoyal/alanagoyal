"use client";

import { Textarea } from "./ui/textarea";

export default function NewNoteContent({ setContent, handleKeyPress }: { setContent: (content: string) => void, handleKeyPress: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void }) {

  return (
    <div className="h-full">
      <Textarea
        className="bg-[#1e1e1e] min-h-screen"
        placeholder="Start writing in markdown..."
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyPress}
      />
    </div>
  );
}
