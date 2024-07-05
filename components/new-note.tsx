"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Icons } from "./icons";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import SessionId from "./session-id";

export default function NewNote({ addNewPinnedNote }: { addNewPinnedNote: (slug: string) => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const noteId = uuidv4();
  const slug = `new-note-${noteId}`;

  const note = {
    id: noteId,
    slug: slug,
    title: "",
    content: "",
    public: false,
    created_at: new Date().toISOString(),
    session_id: sessionId,
    category: "today",
    emoji: "👋🏼",
  };

  const createNote = useCallback(async () => {
    try {
      router.push(`/${slug}`);
      router.refresh(); 

      supabase
        .from('notes')
        .upsert(note, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error("Error upserting note:", error);
        });

      addNewPinnedNote(slug); 

    } catch (error) {
      console.error("Error creating note:", error);
    }
  }, [note, router, supabase, slug, addNewPinnedNote]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && event.metaKey) {
        createNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [createNote, router]);

  return (
    <div className="flex flex-col items-center justify-center">
      <SessionId setSessionId={setSessionId} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger onClick={createNote} aria-label="Create new note">
            <Icons.new />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1c1c] text-gray-400 border-none">
            Click or press ⌘+/ to create a new note
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
