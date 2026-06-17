import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info" | "muted";
}

const variants = {
  default: "bg-violet-500/15 text-violet-400",
  success: "bg-emerald-500/12 text-emerald-400",
  danger:  "bg-red-500/12    text-red-400",
  warning: "bg-amber-500/12  text-amber-400",
  info:    "bg-blue-500/12   text-blue-400",
  muted:   "bg-white/[0.06]  text-[rgb(120,120,132)]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
