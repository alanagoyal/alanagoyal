import { cache } from "react";
import Note from "@/components/note";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Note as NoteType } from "@/lib/types";
import { cookies } from "next/headers";

// Cached function to fetch a note by slug - eliminates duplicate fetches
const getNote = cache(async (slug: string) => {
  const supabase = createServerClient();
  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single() as { data: NoteType | null };
  return note;
});

// Enable ISR with 24-hour revalidation for public notes
export const revalidate = 86400;

// Use dynamic rendering for non-public notes
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug.replace(/^notes\//, '');
  const note = await getNote(slug);

  if (!note) {
    return { title: "Note not found" };
  }

  const title = note.title || "new note";
  const emoji = note.emoji || "👋🏼";

  return {
    title: `alana goyal | ${title}`,
    openGraph: {
      images: [
        `/notes/api/og/?title=${encodeURIComponent(title)}&emoji=${encodeURIComponent(
          emoji
        )}`,
      ],
    },
  };
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug.replace(/^notes\//, '');
  const note = await getNote(slug);

  if (!note) {
    return redirect("/notes/error");
  }

  // Force dynamic rendering for private notes by accessing cookies
  // This ensures fresh data on navigation for user's private notes
  if (!note.public) {
    cookies(); // This opt-out marker forces dynamic rendering
  }

  return (
    <div className="w-full min-h-dvh p-3">
      <Note note={note} />
    </div>
  );
}

// Pre-generate static pages only for public notes at build time
// Private notes will be dynamically rendered (forced by cookies() call above)
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return posts!.map(({ slug }) => ({
    slug,
  }));
}