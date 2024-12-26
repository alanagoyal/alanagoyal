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
  }
>(({ className, children, withVerticalMargins = false, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar withVerticalMargins={withVerticalMargins} />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

// Add vertical margins to for chat area component
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    withVerticalMargins?: boolean
  }
>(({ className, orientation = "vertical", withVerticalMargins = false, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        cn(
          "w-[14px]",
          withVerticalMargins ? "h-[calc(100%-8rem)] my-16" : "h-full"
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
        "border-4 border-solid border-transparent bg-clip-padding",
        "bg-[rgba(0,0,0,0.2)] dark:bg-[rgba(255,255,255,0.2)]",
        "hover:bg-[rgba(0,0,0,0.3)] dark:hover:bg-[rgba(255,255,255,0.3)]"
      )} 
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
