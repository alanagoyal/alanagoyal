import ReactMarkdown from "react-markdown";
import NewNoteContent from "./new-note-content";

export default function NoteContent({ note }: { note: any }) {
  return (
    <div className="bg-[#1e1e1e] h-full text-sm">
      <ReactMarkdown>{note.content}</ReactMarkdown>
    </div>
  );
}
