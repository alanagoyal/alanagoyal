import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/server";
import ResizableLayout from "@/components/sidebar-layout";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const { data } = await supabase.from("notes").select("*");
  return (
    <html lang="en">
      <head>
        <title>{siteConfig.title}</title>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta property="twitter:title" content={siteConfig.name}></meta>
        <meta property="twitter:description" content={siteConfig.description}></meta>
        <meta
          property="twitter:image"
          content={siteConfig.og}
        ></meta>
        <meta property="og:site_name" content={siteConfig.name}></meta>
        <meta property="og:description" content={siteConfig.description}></meta>
        <meta property="og:title" content={siteConfig.name}></meta>
        <meta
          property="og:image"
          content={siteConfig.og}
        />
        <meta property="og:url" content={siteConfig.url}></meta>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ResizableLayout data={data}>{children}</ResizableLayout>
      </body>
    </html>
  );
}
