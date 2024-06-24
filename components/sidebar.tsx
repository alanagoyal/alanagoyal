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

  useEffect(() => {
    const slug = pathname.split("/").pop();
    setSelectedNoteSlug(slug || null);
  }, [pathname]);

  const userSpecificNotes = notes.filter(
    (note) => note.public || note.session_id === sessionId
  );
  const groupedNotes = groupNotesByCategory(userSpecificNotes);
  sortGroupedNotes(groupedNotes);

  function MobileSidebar({
    groupedNotes,
    selectedNoteSlug,
  }: {
    groupedNotes: any;
    selectedNoteSlug: string | null;
  }) {
    return (
      <div className="pt-4 px-2">
        <ul className="space-y-2">
          <li className="min-h-[50px] ml-1 flex items-center justify-center">
            <NewNote />
          </li>
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] ? (
              <li key={categoryKey}>
                <ul>
                  {groupedNotes[categoryKey].map((item: any, index: number) => (
                    <MobileNoteItem
                      key={index}
                      item={item}
                      selectedNoteSlug={selectedNoteSlug}
                    />
                  ))}
                </ul>
              </li>
            ) : null
          )}
        </ul>
      </div>
    );
  }

  function DesktopSidebar({
    groupedNotes,
    selectedNoteSlug,
  }: {
    groupedNotes: any;
    selectedNoteSlug: string | null;
  }) {
    return (
      <div className="pt-4 px-2">
        <div className="flex py-2 mx-2 items-center justify-between">
          <p className="text-lg font-bold">Notes</p>
          <NewNote />
        </div>
        <ul>
          {categoryOrder.map((categoryKey) =>
            groupedNotes[categoryKey] ? (
              <li key={categoryKey}>
                <h3 className="py-2 text-sm font-bold text-gray-300 ml-2">
                  {labels[categoryKey as keyof typeof labels]}
                </h3>
                <ul className="space-y-2">
                  {groupedNotes[categoryKey].map((item: any, index: number) => (
                    <DesktopNoteItem
                      key={index}
                      item={item}
                      selectedNoteSlug={selectedNoteSlug}
                    />
                  ))}
                </ul>
              </li>
            ) : null
          )}
        </ul>
      </div>
    );
  }

  function MobileNoteItem({
    item,
    selectedNoteSlug,
  }: {
    item: any;
    selectedNoteSlug: string | null;
  }) {
    return (
      <li
        className={`min-h-[50px] py-2 flex items-center justify-center ${
          item.slug === selectedNoteSlug ? "bg-[#9D7D28] rounded-md" : ""
        }`}
      >
        <Link href={`/${item.slug || ""}`} prefetch={true}>
          <h2 className="text-sm font-bold">{item.emoji}</h2>
        </Link>
      </li>
    );
  }

  function DesktopNoteItem({
    item,
    selectedNoteSlug,
  }: {
    item: any;
    selectedNoteSlug: string | null;
  }) {
    return (
      <li
        className={`min-h-[50px] py-2 ${
          item.slug === selectedNoteSlug ? "bg-[#9D7D28] rounded-md" : ""
        }`}
      >
        <Link href={`/${item.slug || ""}`} prefetch={true}>
          <h2 className="text-sm font-bold pl-4">
            {item.emoji} {item.title}
          </h2>
          <p className="text-xs pl-4 pr-4 overflow-hidden text-ellipsis whitespace-nowrap text-gray-300">
            <span className="text-white">
              {new Date(item.created_at).toLocaleDateString("en-US")}
            </span>{" "}
            {item.content.trim().replace(/[#_*~`>+\[\]!()-]/g, " ")}
          </p>
        </Link>
      </li>
    );
  }

  function groupNotesByCategory(notes: any[]) {
    const groupedNotes: any = {};

    notes.forEach((note) => {
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
          category = "today";
        } else if (createdDate.toDateString() === yesterday.toDateString()) {
          category = "yesterday";
        } else if (createdDate > sevenDaysAgo) {
          category = "7";
        } else if (createdDate > thirtyDaysAgo) {
          category = "30";
        } else {
          category = "older";
        }
      }

      if (!groupedNotes[category]) {
        groupedNotes[category] = [];
      }
      groupedNotes[category].push(note);
    });

    return groupedNotes;
  }

  function sortGroupedNotes(groupedNotes: any) {
    Object.keys(groupedNotes).forEach((category) => {
      groupedNotes[category].sort((a: any, b: any) =>
        b.created_at.localeCompare(a.created_at)
      );
    });
  }

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
    older: "Older",
  };

  const categoryOrder = ["pinned", "today", "yesterday", "7", "30"];

  return (
    <>
      <SessionId setSessionId={setSessionId} />
      {isMobile ? (
        <MobileSidebar
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
        />
      ) : (
        <DesktopSidebar
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
        />
      )}
    </>
  );
}
