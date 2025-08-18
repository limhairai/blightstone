"use client"

import * as React from "react"
import { Calendar, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface InlineDatePickerProps {
  currentDate: string | null | undefined // Can be null, undefined, or date string
  onDateChange: (newDate: string | null) => void
  disabled?: boolean
  isUpdating?: boolean
  placeholder?: string
  size?: "sm" | "md"
  className?: string
  showClearButton?: boolean
}

export function InlineDatePicker({
  currentDate,
  onDateChange,
  disabled = false,
  isUpdating = false,
  placeholder = "Select date",
  size = "md",
  className,
  showClearButton = true
}: InlineDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Convert string date to Date object for calendar
  const dateValue = currentDate ? new Date(currentDate) : undefined
  
  const formatDisplayDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return placeholder
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return placeholder
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onDateChange(null)
    } else {
      // Convert to YYYY-MM-DD format for consistency
      const formattedDate = date.toISOString().split('T')[0]
      onDateChange(formattedDate)
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "sm" : "default"}
          className={cn(
            "h-auto p-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
          disabled={disabled || isUpdating}
        >
          <Badge 
            variant={currentDate ? "secondary" : "outline"}
            className={cn(
              "cursor-pointer hover:opacity-80 transition-opacity border flex items-center gap-1",
              currentDate 
                ? "bg-blue-100 text-blue-800 border-blue-200" 
                : "bg-gray-50 text-gray-600 border-gray-200",
              size === "sm" ? "text-xs px-2 py-1" : "px-2.5 py-1",
              isUpdating && "opacity-60"
            )}
          >
            <CalendarIcon className={cn(
              size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
            )} />
            {formatDisplayDate(currentDate)}
            {currentDate && showClearButton && (
              <button
                onClick={handleClear}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                title="Clear date"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          initialFocus
        />
        {showClearButton && currentDate && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDateSelect(undefined)}
              className="w-full"
            >
              Clear Date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}