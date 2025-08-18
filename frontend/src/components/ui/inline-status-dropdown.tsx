"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Define status configurations for different entity types
export interface StatusOption {
  value: string
  label: string
  color: string
  dotColor?: string
}

// Common status configurations
export const TASK_STATUS_OPTIONS: StatusOption[] = [
  { value: "todo", label: "To Do", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800 border-green-200" }
]

export const CREATIVE_STATUS_OPTIONS: StatusOption[] = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { value: "in-review", label: "In Review", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "live", label: "Live", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "paused", label: "Paused", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800 border-blue-200" }
]

export const PERSONA_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-600 border-gray-200" }
]

export const COMPETITOR_STATUS_OPTIONS: StatusOption[] = [
  { value: "monitoring", label: "Monitoring", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "active", label: "Active Threat", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "opportunity", label: "Opportunity", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-600 border-gray-200" }
]

interface InlineStatusDropdownProps {
  currentStatus: string
  statusOptions: StatusOption[]
  onStatusChange: (newStatus: string) => void
  disabled?: boolean
  isUpdating?: boolean
  size?: "sm" | "md"
  className?: string
}

export function InlineStatusDropdown({
  currentStatus,
  statusOptions,
  onStatusChange,
  disabled = false,
  isUpdating = false,
  size = "md",
  className
}: InlineStatusDropdownProps) {
  const [open, setOpen] = React.useState(false)
  
  const currentOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0]
  
  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus || disabled || isUpdating) return
    
    setOpen(false)
    onStatusChange(newStatus)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
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
            variant="secondary" 
            className={cn(
              "cursor-pointer hover:opacity-80 transition-opacity border flex items-center gap-1",
              currentOption.color,
              size === "sm" ? "text-xs px-2 py-1" : "px-2.5 py-1",
              isUpdating && "opacity-60"
            )}
          >
            {currentOption.label}
            <ChevronDown className={cn(
              "ml-1 transition-transform duration-200",
              size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
              open && "rotate-180"
            )} />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusSelect(option.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", option.color.split(' ')[0])} />
              <span>{option.label}</span>
            </div>
            {option.value === currentStatus && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}