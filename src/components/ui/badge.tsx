import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "danger" | "neutral";
}

function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-success/15 text-success": variant === "success",
          "bg-danger/15 text-danger": variant === "danger",
          "bg-surface-warm text-muted": variant === "neutral",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
