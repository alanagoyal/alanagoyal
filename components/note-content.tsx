import NewNoteContent from "./new-note-content";

export default function NoteContent({ note }: { note: any }) {
  if (note.title === "new note") {
    return <NewNoteContent />;
  }
  return (
    <div className="bg-[#1e1e1e] h-full text-sm">
      {note.content}
    </div>
  );
}
