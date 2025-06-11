"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  success?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const EnhancedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, helperText, leftIcon, rightIcon, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const inputType = showPasswordToggle && type === "password" ? (showPassword ? "text" : "password") : type

    const hasError = !!error
    const hasSuccess = success && !hasError

    return (
      <div className="space-y-1">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">{leftIcon}</div>
          )}

          <input
            type={inputType}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              (rightIcon || showPasswordToggle || hasError || hasSuccess) && "pr-10",
              hasError && "border-red-500 focus-visible:ring-red-500",
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              isFocused && "ring-1 ring-ring",
              className,
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
            {hasSuccess && <Check className="h-4 w-4 text-green-500" />}
            {showPasswordToggle && type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            {rightIcon && !hasError && !hasSuccess && !showPasswordToggle && rightIcon}
          </div>
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              "text-xs transition-colors duration-200",
              hasError ? "text-red-500" : "text-muted-foreground",
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }
