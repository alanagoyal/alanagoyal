import NoteLoader from "@/components/note-loader";

// Disable all caching and server-side generation
// Load note content client-side for instant navigation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug.replace(/^notes\//, '');

  return (
    <div className="w-full min-h-dvh p-3">
      <NoteLoader slug={slug} />
    </div>
  );
}