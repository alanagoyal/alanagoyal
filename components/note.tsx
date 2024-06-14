import NoteContent from "./note-content";
import NoteHeader from "./note-header";

export default function Note({ note }: { note: any }) {
  return (
    <div>
      <NoteHeader note={note} />
      <NoteContent note={note} />
    </div>
  );
}
