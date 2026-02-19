import { redirect } from "next/navigation";
import { Metadata } from "next";
import { DesktopNotesShell } from "../desktop-notes-shell";
import { getNoteBySlug, getPublicNoteSlugs } from "@/lib/notes/server-note";

export const revalidate = 86400;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublicNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNoteBySlug(cleanSlug);

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

export default async function DesktopNotePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNoteBySlug(cleanSlug);

  if (!note) {
    return redirect("/notes/error");
  }

  return <DesktopNotesShell initialSlug={cleanSlug} />;
}
