"use client";

import type { ComponentProps } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SettingsSwitchProps = ComponentProps<typeof Switch> & {
  isMobile?: boolean;
};

export function SettingsSwitch({
  className,
  isMobile = false,
  ...props
}: SettingsSwitchProps) {
  return (
    <Switch
      className={cn(
        isMobile
          ? "h-7 w-12 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 [&>span]:h-6 [&>span]:w-6 [&>span]:bg-white data-[state=checked]:[&>span]:translate-x-5"
          : "h-6 w-10 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-white",
        className
      )}
      {...props}
    />
  );
}
