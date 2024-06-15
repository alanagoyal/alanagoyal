"use client";

import { createClient } from "@/utils/supabase/client";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";

export default function NewNoteContent() {
  const supabase = createClient();

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      const content = (event.target as HTMLTextAreaElement).value;
      const note = {
        title: "new note from user",
        content: content,
        created_at: new Date().toISOString(),
        public: false,
      };
      addNoteToDatabase(note, event);
    }
  };

  async function addNoteToDatabase(note: any, event: React.KeyboardEvent<HTMLTextAreaElement>) {
    try {
      const { error } = await supabase.from("notes").insert(note);
      if (error) {
        console.error("Error adding note to database:", error);
      } else {
        toast({
          title: "Thanks for your note!",
        });
        (event.target as HTMLTextAreaElement).value = "";
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  return (
    <div className="h-full">
      <Textarea
        className="bg-[#1e1e1e] h-full"
        placeholder="Enter your note here..."
        onKeyDown={handleKeyPress}
      />
      <p className="text-xs text-muted-foreground pt-2">Press ⌘ + Enter to send</p>
    </div>
  );
}
