import { cn } from "@/lib/utils";

export function GamesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={cn("rounded-[22%] shadow-sm", className)} aria-hidden="true">
      <defs>
        <linearGradient id="games-bg" x1="18" y1="8" x2="112" y2="124" gradientUnits="userSpaceOnUse">
          <stop stopColor="#765DFF" />
          <stop offset="0.5" stopColor="#275DDC" />
          <stop offset="1" stopColor="#0B2D75" />
        </linearGradient>
        <linearGradient id="games-glass" x1="36" y1="24" x2="92" y2="106" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".93" />
          <stop offset="1" stopColor="white" stopOpacity=".68" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#games-bg)" />
      <circle cx="30" cy="24" r="42" fill="white" opacity=".13" />
      <path d="M44 96h42c8 0 13-8 9-15L77 49H51L33 81c-4 7 1 15 11 15Z" fill="url(#games-glass)" />
      <path d="M48 47h32l-5-13H53l-5 13Z" fill="white" opacity=".9" />
      <path d="M55 34V24h18v10M44 104h42" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <circle cx="94" cy="32" r="9" fill="#65F2A4" stroke="white" strokeWidth="3" />
    </svg>
  );
}
