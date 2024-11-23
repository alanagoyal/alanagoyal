"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Icons } from "./icons"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <div className="relative w-[16px] h-[16px]">
        <div className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0">
          <Icons.sun />
        </div>
        <div className="absolute top-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100">
          <Icons.moon />
        </div>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
