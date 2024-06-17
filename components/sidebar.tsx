"use client";

import { useState } from "react";
import Link from "next/link";
import SessionId from "./session-id";
import { Pin } from "lucide-react";

export default function Sidebar({notes}: {notes: any[] | null}) {
  if (!notes) {
      return null
  }
  
  const [sessionId, setSessionId] = useState("");
  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );

  // Group notes by category
  const groupedNotes = userSpecificNotes.reduce((acc, note) => {
    const category = note.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(note);
    return acc;
  }, {});

  // Sort each group by created_at
  Object.keys(groupedNotes).forEach((category) => {
    groupedNotes[category].sort((a: any, b: any) =>
      b.created_at.localeCompare(a.created_at)
    );
  });

  const renderNote = (item: any, index: number) => (
    <li key={index}>
      <Link href={`/${item.slug || ""}`}>
        <h2 className="font-bold pl-4">{item.title}</h2>
        <p
          className="text-xs pl-4 pr-4"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <strong>
            {new Date(item.created_at).toLocaleDateString("en-US")}
          </strong>{" "}
          {item.content.replace(/[#_*~`>+\[\]!()-]/g, "")}
        </p>
      </Link>
    </li>
  );

  const labels = {
    pinned: (
      <>
        <Pin className="inline-block w-4 h-4 mr-1" /> Pinned
      </>
    ),
    today: "Today",
    yesterday: "Yesterday",
    "7": "Previous 7 Days",
    "30": "Previous 30 Days",
  };

  // Define the order of categories
  const categoryOrder = ["pinned", "today", "yesterday", "7", "30"];

  return (
    <aside className="w-[300px] border-r border-gray-700 p-5">

      <SessionId setSessionId={setSessionId} />
      <ul className="space-y-2">
        {categoryOrder.map((categoryKey) =>
          groupedNotes[categoryKey] ? (
            <li key={categoryKey}>
              <h3 className="py-2">
                {labels[categoryKey as keyof typeof labels]}
              </h3>
              <ul className="space-y-2">
                {groupedNotes[categoryKey as keyof typeof groupedNotes].map(
                  (item: any, index: number) => renderNote(item, index)
                )}
              </ul>
            </li>
          ) : null
        )}
      </ul>
    </aside>
  );
}
