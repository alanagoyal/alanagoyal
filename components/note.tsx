"use client";

import { createClient } from "@/utils/supabase/client";
import NewNoteContent from "./new-note-content";
import NewNoteHeader from "./new-note-header";
import NoteContent from "./note-content";
import NoteHeader from "./note-header";
import { toast } from "./ui/use-toast";
import { useState } from "react";
import SessionId from "./session-id";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

export default function Note({ note }: { note: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [sessionId, setSessionId] = useState("");

  async function addNoteToDatabase() {
   setContent(content);
   setTitle(title);
   
    const newNote = {
      title: title,
      slug: `new-note-${uuidv4()}`,
      content: content,
      created_at: new Date(),
      public: false,
      session_id: sessionId,
    };

    try {
      const { error } = await supabase.from("notes").insert(newNote);
      if (error) {
        console.error("Error adding note to database:", error);
      } else {
        toast({
          description: "Thanks for your note!",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  if (note.title === "new note") {
    return (
    <div>
      <SessionId setSessionId={setSessionId} />
      <NewNoteHeader note={note} setTitle={setTitle} />
      <NewNoteContent setContent={setContent} addNoteToDatabase={addNoteToDatabase} />
    </div>)
  }
  return (
    <div>
      <NoteHeader note={note} />
      <NoteContent note={note} />
    </div>
  );
}
