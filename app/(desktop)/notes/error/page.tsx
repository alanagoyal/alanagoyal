import { redirect } from "next/navigation";

export default function NotesErrorPage() {
  redirect("/notes");
}
