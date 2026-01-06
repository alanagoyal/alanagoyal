"use client";

import App from "./app";

interface MessagesAppProps {
  isMobile?: boolean;
  inShell?: boolean; // When true, prevent URL updates
}

// Wrapper for Messages app in the desktop/mobile environment
export function MessagesApp({ isMobile = false, inShell = false }: MessagesAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App isDesktop={!isMobile} inShell={inShell} />
    </div>
  );
}
