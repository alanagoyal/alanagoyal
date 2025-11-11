import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const supabase = createClient();
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch public notes" },
        { status: 500 }
      );
    }

    return NextResponse.json(notes || [], {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
      },
    });
  } catch (error) {
    console.error("Error in public notes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
