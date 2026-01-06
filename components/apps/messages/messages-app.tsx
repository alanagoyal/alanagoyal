"use client";

import App from "./app";

// Wrapper for Messages app in the desktop environment
export function MessagesApp() {
  return (
    <div className="h-full w-full overflow-hidden">
      <App />
    </div>
  );
}
