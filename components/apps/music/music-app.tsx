"use client";

import { AudioProvider } from "@/lib/music/audio-context";
import App from "./app";

interface MusicAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

export function MusicApp({ isMobile = false, inShell = false }: MusicAppProps) {
  return (
    <AudioProvider>
      <div className="h-full w-full overflow-hidden">
        <App isDesktop={!isMobile} inShell={inShell} />
      </div>
    </AudioProvider>
  );
}
