"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onCheckedChange, disabled, className }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none",
        "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        className,
      )}
      style={{ background: checked ? "rgb(139,92,246)" : "rgba(255,255,255,0.1)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
