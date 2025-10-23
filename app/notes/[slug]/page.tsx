import Note from "@/components/note";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Note as NoteType } from "@/lib/types";

// Enable ISR with a reasonable revalidation period for public notes
export const revalidate = 86400; // 24 hours

// Dynamically determine if this is a user note
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

// Use dynamic rendering for non-public notes
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createBrowserClient();
  const slug = params.slug.replace(/^notes\//, '');

  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single() as { data: NoteType | null };

  const title = note?.title || "new note";
  const emoji = note?.emoji || "👋🏼";

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
  const supabase = createBrowserClient();
  const slug = params.slug.replace(/^notes\//, '');

  const { data: note } = await supabase.rpc("select_note", {
    note_slug_arg: slug,
  }).single();

  if (!note) {
    return redirect("/notes/error");
  }

  return (
    <div className="w-full min-h-dvh p-3">
      <Note note={note} />
    </div>
  );
}