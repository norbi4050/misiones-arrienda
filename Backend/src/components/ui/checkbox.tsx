"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  className?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          onChange={handleChange}
          className={`
            peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50
            checked:bg-blue-600 checked:border-blue-600
            ${className || ''}
          `}
          {...props}
        />
        <Check className="absolute h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
