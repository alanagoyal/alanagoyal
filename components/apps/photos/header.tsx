import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PHOTOS_HEADER_HEIGHT_PX = 69;
export const PHOTOS_HEADER_HEIGHT_CLASS_NAME =
  "h-[69px] min-h-[69px] shrink-0";

interface PhotosHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  isMobileView: boolean;
}

export function PhotosHeader({
  children,
  className,
  isMobileView,
  ...props
}: PhotosHeaderProps) {
  return (
    <div
      data-photos-header="true"
      className={cn(
        "relative flex items-center border-b px-4 py-3 select-none dark:border-foreground/20",
        isMobileView ? "bg-background" : "bg-muted/50",
        className,
        PHOTOS_HEADER_HEIGHT_CLASS_NAME,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
