"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { Pin } from "lucide-react";
import NewNote from "./new-note";
import SearchBar from "./search";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar({
  notes,
  onNoteSelect,
}: {
  notes: any[];
  onNoteSelect?: () => void;
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

  function SidebarContent({
    groupedNotes,
    selectedNoteSlug,
  }: {
    groupedNotes: any;
    selectedNoteSlug: string | null;
  }) {
    const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(null);

    return (
      <div className="pt-4 px-2">
        <SearchBar notes={notes} onSearchResults={setLocalSearchResults} />
        <div className="flex py-2 mx-2 items-center justify-between">
          <h2 className="text-lg font-bold">Notes</h2>
          <NewNote />
        </div>
        {localSearchResults === null ? (
          <nav>
            {categoryOrder.map((categoryKey) =>
              groupedNotes[categoryKey] ? (
                <section key={categoryKey}>
                  <h3 className="py-2 text-sm font-bold text-gray-300 ml-2">
                    {labels[categoryKey as keyof typeof labels]}
                  </h3>
                  <ul className="space-y-2">
                    {groupedNotes[categoryKey].map((item: any, index: number) => (
                      <NoteItem
                        key={index}
                        item={item}
                        selectedNoteSlug={selectedNoteSlug}
                        sessionId={sessionId}
                        onNoteSelect={onNoteSelect}
                      />
                    ))}
                  </ul>
                </section>
              ) : null
            )}
          </nav>
        ) : localSearchResults.length > 0 ? (
          <ul className="space-y-2">
            {localSearchResults.map((item) => (
              <NoteItem
                key={item.id}
                item={item}
                selectedNoteSlug={selectedNoteSlug}
                sessionId={sessionId}
                onNoteSelect={onNoteSelect}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 px-2 mt-4">No results found</p>
        )}
      </div>
    );
  }

  function NoteItem({
    item,
    selectedNoteSlug,
    sessionId,
    onNoteSelect,
  }: {
    item: any;
    selectedNoteSlug: string | null;
    sessionId: string;
    onNoteSelect?: () => void;
  }) {
    const router = useRouter();
    const supabase = createClient();

    const handleDelete = async () => {
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('slug', item.slug)
          .eq('session_id', sessionId);

        if (error) {
          throw error;
        }

        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    };

    const handleEdit = () => {
      router.push(`/${item.slug}`);
    };

    const canEditOrDelete = item.session_id === sessionId;

    const handleNoteClick = () => {
      router.push(`/${item.slug || ""}`);
      if (onNoteSelect) {
        onNoteSelect();
      }
    };

    const NoteContent = (
      <li
        className={`min-h-[50px] py-2 ${
          item.slug === selectedNoteSlug ? "bg-[#9D7D28] rounded-md" : ""
        }`}
        onClick={handleNoteClick}
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

    return canEditOrDelete ? (
      <ContextMenu>
        <ContextMenuTrigger>{NoteContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleDelete}>Delete</ContextMenuItem>
          <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ) : (
      NoteContent
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
    <div className="h-full flex flex-col overflow-hidden">
      <SessionId setSessionId={setSessionId} />
      <div className="flex-1 overflow-y-auto">
        <SidebarContent
          groupedNotes={groupedNotes}
          selectedNoteSlug={selectedNoteSlug}
        />
      </div>
    </div>
  );
}
