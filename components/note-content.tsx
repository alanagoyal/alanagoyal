import ReactMarkdown from "react-markdown";

export default function NoteContent({ note }: { note: any }) {
  return (
    <div className="bg-[#1e1e1e] h-full text-sm">
      <ReactMarkdown className="markdown-body">{note.content}</ReactMarkdown>
    </div>
  );
}
