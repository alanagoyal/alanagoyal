import { Metadata } from "next";
import { headers } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { isMobileUserAgent } from "@/lib/is-mobile-user-agent";
import { Note as NoteType } from "@/lib/notes/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "alana goyal",
    openGraph: {
      images: [`/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`],
    },
  };
}

export default async function NotesPage() {
  const userAgent = (await headers()).get("user-agent");

  if (isMobileUserAgent(userAgent)) {
    const supabase = await createServerClient();
    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("public", true)
      .order("created_at", { ascending: false });

    return <MobileShell initialApp="notes" initialNotes={(notes ?? []) as NoteType[]} />;
  }

  return <Desktop initialAppId="notes" initialNoteSlug="about-me" />;
}
