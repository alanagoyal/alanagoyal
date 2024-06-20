"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import NewNote from "./new-note";

export default function Sidebar({
  notes,
  isMobile,
}: {
  notes: any[];
  isMobile: boolean;
}) {
  const [sessionId, setSessionId] = useState("");
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);

  const pathname = usePathname();

  // Update selectedNoteSlug when the URL changes
  useEffect(() => {
    const slug = pathname.split("/").pop();
    setSelectedNoteSlug(slug || null);
  }, [pathname]);

  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );

  // Group notes by category
  const groupedNotes = userSpecificNotes.reduce((acc, note) => {
    let category = note.category;
    if (!note.public) {
      const createdDate = new Date(note.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (createdDate.toDateString() === today.toDateString()) {
        category = 'today';
      } else if (createdDate.toDateString() === yesterday.toDateString()) {
        category = 'yesterday';
      } else if (createdDate > sevenDaysAgo) {
        category = '7';
      } else if (createdDate > thirtyDaysAgo) {
        category = '30';
      } else {
        category = 'older';
      }
    }

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

  const renderNote = (item: any, index: number) => {
    if (isMobile) {
      return (
        <li
          key={index}
          className={`${
            item.slug === selectedNoteSlug ? "bg-[#a78825] rounded-md" : ""
          } min-h-[50px] py-2 flex items-center justify-center`}
        >
          <Link
            href={`/${item.slug || ""}`}
            onClick={() => setSelectedNoteSlug(item.slug)}
          >
            <span className="font-bold">{item.emoji}</span>
          </Link>
        </li>
      );
    } else {
      return (
        <li
          key={index}
          className={`${
            item.slug === selectedNoteSlug ? "bg-[#a78825] rounded-md" : ""
          } min-h-[50px] py-2`}
        >
          <Link
            href={`/${item.slug || ""}`}
            onClick={() => setSelectedNoteSlug(item.slug)}
          >
            <h2 className="font-bold pl-4">
              {item.emoji} {item.title}
            </h2>
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
              {item.content.trim().replace(/[#_*~`>+\[\]!()-]/g, " ")}
            </p>
          </Link>
        </li>
      );
    }
  };

  const labels = {
    pinned: (
      <>
        {isMobile ? (
          <div className="flex justify-center">
            Pinned
          </div>
        ) : (
          <>
            <Pin className="inline-block w-5 h-5 mr-1" /> Pinned
          </>
        )}
      </>
    ),
    today: "Today",
    yesterday: "Yesterday",
    "7": "Previous 7 Days",
    "30": "Previous 30 Days",
    older: "Older",
  };

  const categoryOrder = ["pinned", "today", "yesterday", "7", "30"];

  return (
    <div className={`${isMobile ? "px-2 pt-5" : "p-5"}`}>
      <SessionId setSessionId={setSessionId} />
{      <div className={`flex py-2 ${isMobile ? "justify-center" : "items-center justify-between"}`}>
        {!isMobile && <p className="text-lg font-bold">Notes</p>}
        <NewNote />
      </div>}
      <ul>
        {isMobile ? (
          categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] ? (
              groupedNotes[categoryKey].map((item: any, index: number) => renderNote(item, index))
            ) : null
          )
        ) : (
          categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] ? (
              <li key={categoryKey}>
                <h3 className={`py-2 ${isMobile ? "text-center" : ""}`}>
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul className="space-y-2">
                  {groupedNotes[categoryKey as keyof typeof groupedNotes].map(
                    (item: any, index: number) => renderNote(item, index)
                  )}
                </ul>
              </li>
            ) : null
          )
        )}
      </ul>
    </div>
  );
}

