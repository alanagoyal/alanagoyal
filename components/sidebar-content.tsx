import Link from "next/link";

export default function SidebarContent({notes}: {notes: any[]}) {
  const sortedNotes = notes.sort((a, b) => a.created_at.localeCompare(b.created_at));

  function formatTitleForUrl(title: string): string {
    if (title) {
      return title.replace(/\s+/g, '-');
    }
    return ''
  }

  return (
    <>
      <ul className="space-y-4">
        {sortedNotes.map((item, index) => (
          <li key={index}>
            <Link href={`/${formatTitleForUrl(item.title)}`}>
              <h2 className="font-bold">{item.title} {item.emoji}</h2>
              <p>{item.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
