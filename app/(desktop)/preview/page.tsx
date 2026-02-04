"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

function PreviewPageContent() {
  const searchParams = useSearchParams();
  const initialFilePath = searchParams.get("file");

  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    setIsHydrated(true);

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isMobile) {
    return <MobileShell initialApp="preview" />;
  }

  return <Desktop initialAppId="preview" initialPreviewFile={initialFilePath || undefined} />;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <PreviewPageContent />
    </Suspense>
  );
}
