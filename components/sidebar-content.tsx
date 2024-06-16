"use client";

import { useState } from "react";
import Link from "next/link";
import SessionId from "./session-id";

export default function SidebarContent({ notes }: { notes: any[] }) {
  const [sessionId, setSessionId] = useState("");
  const userSpecificNotes = notes.filter(note => note.public || note.session_id === sessionId);
  const sortedNotes = userSpecificNotes.sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  return (
    <>
      <SessionId setSessionId={setSessionId} />
      <ul className="space-y-4">
        {sortedNotes.map((item, index) => (
          <li key={index}>
            <Link href={`/${item.slug}`}>
              <h2 className="font-bold">{item.title}</h2>
              <p>{item.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
