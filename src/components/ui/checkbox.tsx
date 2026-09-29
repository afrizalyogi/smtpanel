import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            className="w-4 h-4 rounded border-border bg-transparent accent-accent focus:ring-accent focus:ring-2 cursor-pointer disabled:opacity-50 shrink-0"
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-1.5">
            {label && (
              <label 
                htmlFor={inputId} 
                className="text-sm font-medium text-fg cursor-pointer select-none leading-none"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
