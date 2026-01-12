import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the default note
  redirect("/notes/about-me");
}
