"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[rgb(150,150,162)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 text-[13.5px] text-white placeholder-[rgb(75,75,88)] rounded-xl transition-all duration-150 resize-y min-h-[100px]",
            "bg-[rgb(16,16,20)] border border-white/[0.08]",
            "focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10",
            "hover:border-white/[0.13]",
            error && "border-red-500/40",
            className,
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-red-400">{error}</p>}
        {hint && !error && <p className="text-[12px] text-[rgb(100,100,115)]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
