import { sidebarItems } from "@/lib/utils";
import Link from "next/link";

export default function SidebarContent() {
  return (
    <>
      <ul className="space-y-4">
        {sidebarItems.map((item, index) => (
          <li key={index}>
            <Link href={item.href}>
              <h2 className="font-bold">{item.title}</h2>
              <p>{item.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
