import { cache } from "react";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Note as NoteType } from "@/lib/notes/types";
import { NotesDesktopPage } from "./notes-desktop-page";

// Enable ISR with a reasonable revalidation period for public notes
export const revalidate = 86400; // 24 hours

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

async function isMobileRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const clientHintMobile = requestHeaders.get("sec-ch-ua-mobile");

  if (clientHintMobile === "?1") {
    return true;
  }

  const userAgent = requestHeaders.get("user-agent") || "";
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}

// Cached function to fetch a note by slug - eliminates duplicate fetches
const getNote = cache(async (slug: string) => {
  const supabase = await createServerClient();
  const { data: note } = (await supabase
    .rpc("select_note", {
      note_slug_arg: slug,
    })
    .single()) as { data: NoteType | null };
  return note;
});

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

  // Invalid slug - redirect to error page
  if (!note) {
    return redirect("/notes/error");
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
