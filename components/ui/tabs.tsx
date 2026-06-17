"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn("inline-flex items-center p-1 gap-0.5 rounded-xl", className)}
      style={{ background: "rgb(16,16,20)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "h-8 px-4 rounded-lg text-[12.5px] font-medium transition-all duration-150",
              isActive
                ? "bg-white/[0.09] text-white"
                : "text-[rgb(100,100,115)] hover:text-[rgb(180,180,195)]"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
