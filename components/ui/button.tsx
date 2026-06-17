"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const variants = {
  primary:   "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-sm shadow-violet-900/30",
  secondary: "bg-white/[0.06] hover:bg-white/[0.1] text-[rgb(210,210,220)]",
  ghost:     "hover:bg-white/[0.06] text-[rgb(160,160,175)] hover:text-white",
  danger:    "bg-red-500/10 hover:bg-red-500/15 text-red-400",
  outline:   "border border-white/[0.1] hover:border-white/[0.18] text-[rgb(180,180,190)] hover:text-white",
};

const sizes = {
  sm:   "h-8 px-3.5 text-[12.5px] rounded-lg gap-1.5",
  md:   "h-9 px-4   text-[13.5px] rounded-xl gap-2",
  lg:   "h-11 px-5  text-[14px]   rounded-xl gap-2",
  icon: "h-9 w-9 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer",
        "disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
