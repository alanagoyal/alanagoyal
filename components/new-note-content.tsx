"use client";

import { Textarea } from "./ui/textarea";

export default function NewNoteContent({ setContent, addNoteToDatabase }: { setContent: (content: string) => void, addNoteToDatabase: () => void }) {

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      const content = (event.target as HTMLTextAreaElement).value;
      setContent(content); 
      event.preventDefault(); 
      addNoteToDatabase();
      (event.target as HTMLTextAreaElement).value = "";

    }
  };
   
  return (
    <div className="h-full">
      <Textarea
        className="bg-[#1e1e1e] h-full"
        placeholder="Enter your note here..."
        onKeyDown={handleKeyPress}
      />
      <p className="text-xs text-muted-foreground pt-2">
        Press ⌘ + Enter to send
      </p>
    </div>
  );
}
