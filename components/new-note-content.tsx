"use client";

import { createClient } from "@/utils/supabase/client";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import { useState } from "react";
import SessionId from "./session-id";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

export default function NewNoteContent() {
  const supabase = createClient();
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      const content = (event.target as HTMLTextAreaElement).value;
      const note = {
        title: "new note 👋🏼",
        slug: `new-note-${uuidv4()}`,
        content: content,
        created_at: new Date(),
        public: false,
        session_id: sessionId,
      };
      addNoteToDatabase(note, event);
    }
  };

  async function addNoteToDatabase(
    note: any,
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    try {
      const { error } = await supabase.from("notes").insert(note);
      if (error) {
        console.error("Error adding note to database:", error);
      } else {
        toast({
          description: "Thanks for your note!",
        });
        (event.target as HTMLTextAreaElement).value = "";
      }
      router.refresh();
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  return (
    <div className="h-full">
      <SessionId setSessionId={setSessionId} />
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
