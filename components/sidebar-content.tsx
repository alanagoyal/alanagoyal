import Link from "next/link";

function formatTitleForUrl(title: string): string {
  return title.replace(/\s+/g, '-');
}

export default function SidebarContent({notes}: {notes: any[]}) {
  return (
    <>
      <ul className="space-y-4">
        {notes.map((item, index) => (
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
