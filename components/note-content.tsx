export default function NoteContent({ content }: { content: string }) {
  return (
    <div className="bg-[#1e1e1e] h-full text-sm">
      {content}
    </div>
  );
}
