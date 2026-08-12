"use client";

import type { ComponentProps } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SettingsSwitchProps = ComponentProps<typeof Switch>;

export function SettingsSwitch({
  className,
  ...props
}: SettingsSwitchProps) {
  return (
    <Switch
      className={cn(
        "h-6 w-10 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-white",
        className
      )}
      {...props}
    />
  );
}
