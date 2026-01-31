"use client";

import App from "./app";

interface MusicAppProps {
  isMobile?: boolean;
}

export function MusicApp({ isMobile = false }: MusicAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App isDesktop={!isMobile} />
    </div>
  );
}
