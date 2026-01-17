"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Desktop } from "@/components/desktop/desktop";
import { MobileShell } from "@/components/mobile/mobile-shell";

function TextEditPageContent() {
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
    return <MobileShell initialApp="textedit" initialTextEditFile={initialFilePath || undefined} />;
  }

  return <Desktop initialAppId="textedit" initialTextEditFile={initialFilePath || undefined} />;
}

export default function TextEditPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <TextEditPageContent />
    </Suspense>
  );
}
