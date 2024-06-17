import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: siteConfig.name,
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
        <title>{siteConfig.name}</title>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta
          property="twitter:description"
          content={siteConfig.description}
        ></meta>
        <meta
          property="twitter:image"
          content={`${siteConfig.url}/opengraph-image`}
        ></meta>
        <meta property="og:site_name" content={siteConfig.name}></meta>
        <meta property="og:title" content={siteConfig.name}></meta>
        <meta property="og:description" content={siteConfig.description}></meta>
        <meta
          property="og:image"
          content={`${siteConfig.url}/opengraph-image`}
        />
        <meta property="og:url" content={siteConfig.url}></meta>
        <meta
          property="og:image"
          content={`${siteConfig.url}/opengraph-image`}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <div className="bg-[#1e1e1e] text-white min-h-screen">
          <ResizablePanelGroup
            direction="horizontal"
            className="flex min-h-screen"
          >
            <ResizablePanel defaultSize={25} minSize={10}>
              {data && <Sidebar notes={data} />}
            </ResizablePanel>
            <ResizableHandle className="bg-gray-500"/>
            <ResizablePanel defaultSize={75}>
              {children}
              <Toaster />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </body>
    </html>
  );
}
