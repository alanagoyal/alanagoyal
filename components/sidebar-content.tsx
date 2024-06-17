"use client";

import { useState } from "react";
import Link from "next/link";
import SessionId from "./session-id";

export default function SidebarContent({ notes }: { notes: any[] }) {
  const [sessionId, setSessionId] = useState("");
  const userSpecificNotes = notes.filter(note => note.public || note.session_id === sessionId);
  const sortedNotes = userSpecificNotes.sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  const renderNote = (item: any, index: number) => (
    <li key={index}>
      <Link href={`/${item.slug || ''}`}>
        <h2 className="font-bold pl-4">{item.title}</h2>
        <p className="text-xs pl-4 pr-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong>{new Date(item.created_at).toLocaleDateString('en-US')}</strong> {item.content.replace(/[#_*~`>+\[\]!()-]/g, '')}
        </p>
      </Link>
    </li>
  );

  const insertSpecialLabel = (label: string, key: string) => (
    <li key={key}>{label}</li>
  );

  return (
    <>
      <SessionId setSessionId={setSessionId} />
      <ul className="space-y-4">
        {sortedNotes.map((item, index) => {
          const elements = [];
          if (index === 1) {
            elements.push(insertSpecialLabel("Yesterday", "yesterday"));
          }
          if (index === 3) {
            elements.push(insertSpecialLabel("Previous 7 Days", "previous-7-days"));
          }
          if (index === 7) {
            elements.push(insertSpecialLabel("Previous 30 Days", "previous-30-days"));
          }
          elements.push(renderNote(item, index));
          return elements;
        })}
      </ul>
    </>
  );
}
