import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between", className)}
      style={{ marginBottom: "48px" }}
    >
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: "13.5px", color: "rgb(110,110,128)", marginTop: "6px" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-8">{action}</div>}
    </div>
  );
}
