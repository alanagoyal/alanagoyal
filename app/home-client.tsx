"use client";

import { AppShellPage } from "@/lib/desktop/app-shell-page";

interface HomeClientProps {
  initialIsMobile: boolean;
}

export default function HomeClient({ initialIsMobile }: HomeClientProps) {
  return <AppShellPage initialIsMobile={initialIsMobile} />;
}
