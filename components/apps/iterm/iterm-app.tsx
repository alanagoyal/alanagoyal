"use client";

import { Nav } from "./nav";
import { Terminal } from "./terminal";

interface ITermAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

export function ITermApp({ isMobile = false, inShell = false }: ITermAppProps) {
  return (
    <div className="h-full flex flex-col bg-black" data-app="iterm">
      <Nav isMobile={isMobile} isDesktop={inShell} />
      <Terminal isMobile={isMobile} />
    </div>
  );
}
