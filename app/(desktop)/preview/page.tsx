"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";

function PreviewPageContent() {
  const searchParams = useSearchParams();
  const initialFilePath = searchParams.get("file");

  return (
    <AppShellPage
      appId="preview"
      initialPreviewFile={initialFilePath || undefined}
    />
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <PreviewPageContent />
    </Suspense>
  );
}
