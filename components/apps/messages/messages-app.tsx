"use client";

import App from "./app";

interface MessagesAppProps {
  isMobile?: boolean;
}

// Wrapper for Messages app in the desktop/mobile environment
export function MessagesApp({ isMobile = false }: MessagesAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App isDesktop={!isMobile} />
    </div>
  );
}
