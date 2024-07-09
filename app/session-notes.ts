"use client";

import { createClient as createBrowserClient } from "@/utils/supabase/client";

export async function getSessionNotes({ sessionId }: { sessionId: string }) {
  const supabase = createBrowserClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("session_id", sessionId);
  return notes;
}