"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, onChange, disabled, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) onChange(e);
            if (onCheckedChange) onCheckedChange(e.target.checked);
        };

        return (
            <label className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "cursor-pointer",
                checked ? "bg-brand" : "bg-input",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}>
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className="sr-only"
                    {...props}
                />
                <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    checked ? "translate-x-6" : "translate-x-1"
                )} />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
