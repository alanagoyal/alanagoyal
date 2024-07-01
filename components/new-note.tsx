"use client";

import { useCallback, useEffect, useMemo, useState, useContext } from "react";
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
import { MobileContext } from "./sidebar-layout";

export default function NewNote() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const noteId = useMemo(() => uuidv4(), []); 
  const { setShowSidebar } = useContext(MobileContext);

  const note = useMemo(
    () => ({
      id: noteId,
      title: "",
      slug: `new-note-${noteId}`,
      content: "",
      public: false,
      created_at: new Date().toISOString(),
      session_id: sessionId,
      category: "today",
      emoji: "👋🏼",
    }),
    [noteId, sessionId]
  );

  const createNote = useCallback(async () => {
    try {
      const { error } = await supabase.from("notes").insert(note);
      if (error) throw error;
      
      if (setShowSidebar) setShowSidebar(false);
      router.push(`/${note.slug}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating note:", error);
    }
  }, [note, router, setShowSidebar, supabase]);

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
  }, [createNote]);

  return (
    <div className="flex flex-col items-center justify-center">
      <SessionId setSessionId={setSessionId} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger onClick={createNote} aria-label="Create new note">
            <Icons.new />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1c1c] text-gray-300 border-none">
            Click or press ⌘+/ to create a new note
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}