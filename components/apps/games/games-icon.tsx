import Image from "next/image";
import { cn } from "@/lib/utils";

export function GamesIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/games.png"
      alt=""
      width={128}
      height={128}
      className={cn("rounded-[22%] object-contain shadow-sm", className)}
      aria-hidden="true"
      unoptimized
    />
  );
}
