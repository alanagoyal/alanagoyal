import { sidebarItems } from "@/lib/utils";
import Link from "next/link";

export default function SidebarContent({notes}: {notes: any[]}) {
  return (
    <>
      <ul className="space-y-4">
        {notes.map((item, index) => (
          <li key={index}>
            <Link href={`/${item.title}`}>
              <h2 className="font-bold">{item.title}</h2>
              <p>{item.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
