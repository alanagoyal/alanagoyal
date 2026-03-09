"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface PreviewEmptyStateProps {
  onBrowseFiles?: () => void;
  className?: string;
}

export function PreviewEmptyState({
  onBrowseFiles,
  className,
}: PreviewEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full items-center justify-center bg-zinc-100 px-6 text-zinc-900 dark:bg-zinc-900 dark:text-white",
        className
      )}
    >
      <div className="w-full max-w-sm rounded-[28px] border border-black/5 bg-white/70 px-8 py-9 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/70">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] dark:bg-zinc-700/80">
          <Image src="/preview.png" alt="" width={48} height={48} priority={false} />
        </div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
          Open a file in Preview
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Preview is ready for images and PDFs. Open a file from Finder to view
          it here.
        </p>
        {onBrowseFiles && (
          <button
            type="button"
            onClick={onBrowseFiles}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0A7CFF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0069d9]"
          >
            Browse in Finder
          </button>
        )}
        <p className="mt-4 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
          Each image or PDF opens in its own Preview window.
        </p>
      </div>
    </div>
  );
}
