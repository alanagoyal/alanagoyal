import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getNoteBySlug, getPublicNoteSlugs } from "@/lib/notes/server-note";
import { MobileNotesPage } from "../mobile-notes-page";

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

export default async function MobileNotePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNoteBySlug(cleanSlug);

  if (!note) {
    return redirect("/notes/error");
  }

  return <MobileNotesPage initialSlug={cleanSlug} />;
}
