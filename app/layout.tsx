import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {children}
      </body>
    </html>
  );
}
