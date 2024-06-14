import NoteContent from "./note-content";
import NoteHeader from "./note-header";

export default function Note({ note }: { note: any }) {
  return (
    <div>
      <NoteHeader title={note.title} date={note.created_at} />
      <NoteContent content={note.content} />
    </div>
  );
}
