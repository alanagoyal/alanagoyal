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

// Use dynamic rendering to fetch session-specific notes on each request
export const dynamic = 'force-dynamic';

// Helper function to fetch public notes with React cache for deduplication
const getPublicNotes = cache(async () => {
  const supabase = createClient();
  const { data: publicNotes } = await supabase
    .from("notes")
    .select("*")
    .eq("public", true);
  return publicNotes || [];
});

// Helper function to fetch session notes
async function getSessionNotes(sessionId: string) {
  if (!sessionId) return [];

  const supabase = createClient();
  const { data } = await supabase.rpc("select_session_notes", {
    session_id_arg: sessionId
  });
  return data || [];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value || "";

  // Fetch both public and session notes in parallel for better performance
  const [publicNotes, sessionNotes] = await Promise.all([
    getPublicNotes(),
    getSessionNotes(sessionId)
  ]);

  // Combine all notes server-side
  const allNotes = [...publicNotes, ...sessionNotes];

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
          <SidebarLayout notes={allNotes} sessionId={sessionId || ""}>
            <Analytics />
            {children}
          </SidebarLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
