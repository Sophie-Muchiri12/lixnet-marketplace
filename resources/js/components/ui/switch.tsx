import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out",
          checked && "bg-blue-600"
        )}>
          <div className={cn(
            "w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out",
            checked ? "translate-x-6" : "translate-x-0.5"
          )} />
        </div>
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
