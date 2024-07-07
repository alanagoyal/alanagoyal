import Note from "@/components/note";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "error";

export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase.from("notes").select("slug");

  return posts!.map(({ slug }) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    openGraph: {
      images: [`${BASE_URL}/api/og?slug=${params.slug}`],
    },
  };
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createBrowserClient();
  const slug = params.slug;
  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!note) {
    if (slug.startsWith("new-note-")) {
      const newNote = {
        id: slug.replace("new-note-", ""),
        slug: slug,
        title: "",
        content: "",
        emoji: "👋🏼",
        category: "today",
        public: false,
      };
      return (
        <div className="w-full min-h-screen p-3">
          <Note note={newNote} />
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="w-full min-h-screen p-3">
      <Note note={note} />
    </div>
  );
}
