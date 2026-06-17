"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[rgb(150,150,162)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-4 text-[13.5px] text-white rounded-xl transition-all duration-150 cursor-pointer",
            "bg-[rgb(16,16,20)] border border-white/[0.08]",
            "focus:outline-none focus:border-violet-500/50",
            "hover:border-white/[0.13]",
            error && "border-red-500/40",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[rgb(22,22,26)]">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[12px] text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
