"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";

function TextEditPageContent() {
  const searchParams = useSearchParams();
  const initialFilePath = searchParams.get("file");

  return (
    <AppShellPage
      appId="textedit"
      initialTextEditFile={initialFilePath || undefined}
    />
  );
}

export default function TextEditPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <TextEditPageContent />
    </Suspense>
  );
}
