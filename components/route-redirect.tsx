"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RouteRedirectProps {
  basePath: string;
  search?: string;
}

export function RouteRedirect({ basePath, search = "" }: RouteRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash || "";
    router.replace(`${basePath}${search}${hash}`);
  }, [router, basePath, search]);

  return null;
}
