import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60",
          {
            "bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700": variant === "primary",
            "bg-surface-warm border-surface-warm hover:bg-border": variant === "secondary",
            "bg-transparent text-danger border-danger hover:bg-danger/10": variant === "danger",
            "bg-transparent border-transparent hover:bg-surface-warm": variant === "ghost",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
