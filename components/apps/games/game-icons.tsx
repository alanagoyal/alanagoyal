import Image from "next/image";
import { cn } from "@/lib/utils";

export type LibraryGameId = "chess" | "snake" | "2048" | "minesweeper" | "memory" | "breakout";

export function GameTileIcon({ game, className }: { game: LibraryGameId; className?: string }) {
  if (game === "chess") {
    return <Image src="/chess.png" alt="" width={160} height={160} aria-hidden="true" className={cn("aspect-square rounded-[22%] object-cover shadow-[0_6px_16px_rgba(15,23,42,.24)] ring-1 ring-black/10", className)} unoptimized />;
  }

  return (
    <span className={cn(
      "relative block aspect-square overflow-hidden rounded-[22%] shadow-[0_6px_16px_rgba(15,23,42,.24)] ring-1 ring-black/10",
      game === "snake" && "bg-[linear-gradient(145deg,#5ee787_0%,#12a957_52%,#05733f_100%)]",
      game === "2048" && "bg-[linear-gradient(145deg,#ffd66b_0%,#f49a38_52%,#e65d34_100%)]",
      game === "minesweeper" && "bg-[linear-gradient(145deg,#74d5ff_0%,#2384df_54%,#3446a8_100%)]",
      game === "memory" && "bg-[linear-gradient(145deg,#b38bff_0%,#7654de_48%,#4526a3_100%)]",
      game === "breakout" && "bg-[linear-gradient(155deg,#ff6c86_0%,#df365c_42%,#6a2bc2_100%)]",
      className,
    )} aria-hidden="true">
      {game === "snake" && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-lg">
          <path d="M26 26h30a17 17 0 0 1 0 34H42a10 10 0 0 0 0 20h31" fill="none" stroke="#efffdc" strokeWidth="13" strokeLinecap="round" />
          <circle cx="28" cy="26" r="10" fill="#163c24" /><circle cx="25" cy="23" r="2.5" fill="white" />
          <circle cx="77" cy="80" r="8" fill="#ffdc52" />
        </svg>
      )}
      {game === "2048" && <span className="absolute inset-0 flex items-center justify-center text-[25px] font-black tracking-[-2px] text-white drop-shadow-md">2048</span>}
      {game === "minesweeper" && (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-xl">
          <g stroke="#dff7ff" strokeWidth="6" strokeLinecap="round"><path d="M50 13v15M50 72v15M13 50h15M72 50h15M24 24l11 11M65 65l11 11M76 24 65 35M35 65 24 76" /></g>
          <circle cx="50" cy="50" r="23" fill="#17244d" /><circle cx="42" cy="41" r="6" fill="#7184b7" />
        </svg>
      )}
      {game === "memory" && (
        <span className="absolute inset-[17%] grid grid-cols-2 gap-[8%] rotate-[-5deg]">
          {["#ffdb54", "#66e0dc", "#ff7f9f", "#fff"].map((color) => <span key={color} className="rounded-[18%] border border-white/35 shadow-md" style={{ background: color }} />)}
        </span>
      )}
      {game === "breakout" && (
        <span className="absolute inset-0">
          <span className="absolute left-[15%] right-[15%] top-[19%] grid grid-cols-4 gap-[5%]">
            {["#ffe066", "#66e6ff", "#fff", "#ff9f6e", "#66e6ff", "#fff", "#ff9f6e", "#ffe066"].map((color, index) => <span key={`${color}-${index}`} className="h-2.5 rounded-sm shadow-sm" style={{ background: color }} />)}
          </span>
          <span className="absolute left-[45%] top-[58%] h-[12%] w-[12%] rounded-full bg-white shadow-lg" />
          <span className="absolute bottom-[17%] left-[27%] h-[7%] w-[46%] rounded-full bg-white shadow-lg" />
        </span>
      )}
    </span>
  );
}
