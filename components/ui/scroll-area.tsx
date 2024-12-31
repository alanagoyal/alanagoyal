"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * Custom ScrollArea component for the chat interface
 * Customized with:
 * - 64px padding on top and bottom of the scrollbar so its not hidden bethind chat header and message input
 * - Custom scrollbar styling to match the scrollbar design in globals.css
 * - 14px total width with 4px transparent border for a clean look
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    withVerticalMargins?: boolean
    mobileHeaderHeight?: boolean
    isMobile?: boolean
  }
>(({ className, children, withVerticalMargins = false, mobileHeaderHeight = false, isMobile = false, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar withVerticalMargins={withVerticalMargins} mobileHeaderHeight={mobileHeaderHeight} isMobile={isMobile} />
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
  }
>(({ className, orientation = "vertical", withVerticalMargins = false, mobileHeaderHeight = false, isMobile = false, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-all duration-300",
      "opacity-80 hover:opacity-100",
      "bg-transparent hover:border-l hover:border-gray-200 dark:hover:border-gray-700",
      orientation === "vertical" &&
        cn(
          isMobile ? "w-[8px]" : "w-[10px] hover:w-[14px]",
          withVerticalMargins && mobileHeaderHeight
            ? "mt-24 mb-16"
            : withVerticalMargins
            ? "my-16"
            : ""
        ),
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
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
