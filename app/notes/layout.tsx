import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/server";
import SidebarLayout from "@/components/sidebar-layout";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";
import { cache } from "react";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.title,
};

// Use a short revalidation time to balance fresh data with performance
// This allows Next.js to serve cached layouts for 15 seconds, making navigation fast
// router.refresh() will still bypass this cache when explicitly called
export const revalidate = 15;

// Cache notes at the React request level to avoid duplicate fetches within a single render
const getAllNotes = cache(async (sessionId: string | undefined) => {
  const supabase = createClient();

  // Fetch public notes
  const { data: publicNotes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);

  // Fetch private notes for this session if session ID exists
  let sessionNotes: any[] = [];
  if (sessionId) {
    const { data } = await supabase.rpc("select_session_notes", {
      session_id_arg: sessionId,
    });
    sessionNotes = data || [];
  }

  // Combine all notes
  return [...(publicNotes || []), ...sessionNotes];
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  const notes = await getAllNotes(sessionId);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{siteConfig.title}</title>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta property="twitter:title" content={siteConfig.title}></meta>
        <meta
          property="twitter:description"
          content={siteConfig.title}
        ></meta>
        <meta property="og:site_name" content={siteConfig.title}></meta>
        <meta property="og:description" content={siteConfig.title}></meta>
        <meta property="og:title" content={siteConfig.title}></meta>
        <meta property="og:url" content={siteConfig.url}></meta>
      </head>
      <body
        className={cn("min-h-dvh font-sans antialiased", fontSans.variable)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarLayout notes={notes}>
            <Analytics />
            {children}
          </SidebarLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
