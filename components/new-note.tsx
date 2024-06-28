"use client";

import { useEffect, useState } from "react";
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
import { useContext } from "react";
import { MobileContext } from "./sidebar-layout";

export default function NewNote() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const noteId = uuidv4();
  const note = {
    id: noteId,
    title: "",
    slug: `new-note-${noteId}`,
    content: "",
    public: false,
    created_at: new Date().toISOString(),
    session_id: sessionId,
    category: "today",
    emoji: "👋🏼",
  };

  const { setShowSidebar } = useContext(MobileContext);

  async function createNote() {
    await supabase.from("notes").insert(note);
    if (setShowSidebar) setShowSidebar(false);
    router.push(`/${note.slug}`);
    router.refresh();
  }

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
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center">
      <SessionId setSessionId={setSessionId} />
      <TooltipProvider>
        <Tooltip>
        <TooltipTrigger onClick={createNote}>
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
