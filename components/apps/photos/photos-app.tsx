"use client";

import App from "./app";

interface PhotosAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

export function PhotosApp({ isMobile = false, inShell = false }: PhotosAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App isDesktop={!isMobile} inShell={inShell} />
    </div>
  );
}
