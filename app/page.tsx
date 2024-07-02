import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const userAgent = headers().get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const supabase = createClient();

  const { data: notes, error } = await supabase.from("notes").select("*");

  if (!isMobile) {
    redirect("/about-me");
  }

  return (
    <div>
      <Sidebar notes={notes || []} />
    </div>
  );
}
