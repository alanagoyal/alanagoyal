import { cache } from "react";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { isMobileRequest } from "@/lib/is-mobile-request";
import { Note as NoteType } from "@/lib/notes/types";
import { NotesDesktopPage } from "./notes-desktop-page";

// Cached function to fetch a note by slug - eliminates duplicate fetches
const getNote = cache(async (slug: string): Promise<NoteType | null> => {
  const supabase = await createServerClient();
  const { data: note, error } = await supabase
    .rpc("select_note", {
      note_slug_arg: slug,
    })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load note "${slug}": ${error.message}`);
  }

  return note as NoteType | null;
});

// Dynamically determine if this is a user note
export async function generateStaticParams() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return (posts ?? []).map(({ slug }) => ({
    slug,
  }));
}

// Use dynamic rendering for non-public notes
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNote(cleanSlug);

  if (!note) {
    return { title: "Note not found" };
  }

  const title = note.title || "new note";
  const emoji = note.emoji || "👋🏼";

  return {
    title: "alana goyal",
    openGraph: {
      images: [
        `/notes/api/og/?title=${encodeURIComponent(title)}&emoji=${encodeURIComponent(emoji)}`,
      ],
    },
  };
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNote(cleanSlug);
  const initialIsMobile = await isMobileRequest();

  // Invalid slug - fall back to the default notes view
  if (!note) {
    return redirect("/notes");
  }

  // Render Desktop with notes app focused on this specific note
  return (
    <NotesDesktopPage
      slug={cleanSlug}
      initialIsMobile={initialIsMobile}
      initialNote={note}
    />
  );
}
