import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "violet" | "green" | "amber" | "red" | "blue" | "neutral";
  className?: string;
}

const accents = {
  violet:  { iconBg: "rgba(139,92,246,0.12)",  iconClr: "rgb(167,139,250)" },
  green:   { iconBg: "rgba(52,211,153,0.1)",    iconClr: "rgb(52,211,153)"  },
  amber:   { iconBg: "rgba(251,191,36,0.1)",    iconClr: "rgb(251,191,36)"  },
  red:     { iconBg: "rgba(248,113,113,0.1)",   iconClr: "rgb(248,113,113)" },
  blue:    { iconBg: "rgba(96,165,250,0.1)",    iconClr: "rgb(96,165,250)"  },
  neutral: { iconBg: "rgba(255,255,255,0.06)",  iconClr: "rgb(120,120,135)" },
};

export function StatCard({ label, value, sub, icon, accent = "neutral", className }: StatCardProps) {
  const a = accents[accent];
  return (
    <div
      className={cn("rounded-2xl", className)}
      style={{
        background: "rgb(22,22,26)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "28px",
      }}
    >
      {icon && (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: a.iconBg, color: a.iconClr, marginBottom: "20px" }}
        >
          {icon}
        </div>
      )}
      <p style={{ fontSize: "11.5px", fontWeight: 500, color: "rgb(100,100,115)", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: 600, color: "white", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em", lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: "11.5px", color: "rgb(85,85,100)", marginTop: "8px" }}>{sub}</p>}
    </div>
  );
}
