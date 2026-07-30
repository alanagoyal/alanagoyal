"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * Custom scroll area with the shared scrollbar styling from globals.css.
 * Consumers with fixed overlays can opt into top or bottom scrollbar insets.
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    withVerticalMargins?: boolean
    mobileHeaderHeight?: boolean
    isMobile?: boolean
    bottomMargin?: string
    viewportClassName?: string
  }
>(({ className, children, withVerticalMargins = false, mobileHeaderHeight = false, isMobile = false, bottomMargin, viewportClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className={cn("h-full w-full rounded-[inherit]", viewportClassName)}>
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar 
      withVerticalMargins={withVerticalMargins} 
      mobileHeaderHeight={mobileHeaderHeight} 
      isMobile={isMobile}
      bottomMargin={bottomMargin}
    />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

// Add vertical margins to for chat area component
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    withVerticalMargins?: boolean
    mobileHeaderHeight?: boolean
    isMobile?: boolean
    bottomMargin?: string
  }
>(({ className, orientation = "vertical", withVerticalMargins = false, mobileHeaderHeight = false, isMobile = false, bottomMargin, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-all duration-300",
      "opacity-80 can-hover:hover:opacity-100 z-40",
      "bg-transparent can-hover:hover:border-l can-hover:hover:border-gray-200 dark:can-hover:hover:border-gray-700",
      orientation === "vertical" &&
        cn(
          isMobile ? "w-[8px]" : "w-[10px] can-hover:hover:w-[14px]",
          withVerticalMargins && mobileHeaderHeight
            ? "mt-24"
            : withVerticalMargins
            ? "mt-16"
            : ""
        ),
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    style={{ marginBottom: bottomMargin ?? "0px" }}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb 
      className={cn(
        "relative flex-1 rounded-full transition-colors duration-200",
        "border-2 border-solid border-transparent bg-clip-padding",
        "bg-gray-500 dark:bg-gray-400"
      )} 
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
