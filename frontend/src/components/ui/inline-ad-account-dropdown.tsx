"use client"

import * as React from "react"
import { Check, ChevronDown, Monitor } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AdAccount } from "@/lib/stores/project-store"

interface InlineAdAccountDropdownProps {
  currentAdAccountId: string | null | undefined
  adAccounts: AdAccount[]
  onAdAccountChange: (adAccountId: string | null) => void
  disabled?: boolean
  isUpdating?: boolean
  size?: "sm" | "md"
  className?: string
}

export function InlineAdAccountDropdown({
  currentAdAccountId,
  adAccounts,
  onAdAccountChange,
  disabled = false,
  isUpdating = false,
  size = "md",
  className
}: InlineAdAccountDropdownProps) {
  const [open, setOpen] = React.useState(false)
  
  const currentAdAccount = adAccounts.find(account => account.id === currentAdAccountId)
  
  const handleAdAccountSelect = async (adAccountId: string | null) => {
    if (adAccountId === currentAdAccountId || disabled || isUpdating) return
    
    setOpen(false)
    onAdAccountChange(adAccountId)
  }

  const getDisplayText = () => {
    if (currentAdAccount) {
      return `${currentAdAccount.name} (${currentAdAccount.businessManager})`
    }
    return "Select ad account"
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
            variant={currentAdAccount ? "secondary" : "outline"}
            className={cn(
              "cursor-pointer hover:opacity-80 transition-opacity border flex items-center gap-1",
              currentAdAccount 
                ? "bg-purple-100 text-purple-800 border-purple-200" 
                : "bg-gray-50 text-gray-600 border-gray-200",
              size === "sm" ? "text-xs px-2 py-1" : "px-2.5 py-1",
              isUpdating && "opacity-60"
            )}
          >
            <Monitor className={cn(
              size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
            )} />
            <span className="max-w-[120px] truncate">
              {getDisplayText()}
            </span>
            <ChevronDown className={cn(
              "ml-1 transition-transform duration-200",
              size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
              open && "rotate-180"
            )} />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem
          onClick={() => handleAdAccountSelect(null)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span>No ad account</span>
          </div>
          {!currentAdAccountId && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </DropdownMenuItem>
        {adAccounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleAdAccountSelect(account.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <div className="flex flex-col">
                <span className="font-medium">{account.name}</span>
                <span className="text-xs text-muted-foreground">{account.businessManager}</span>
              </div>
            </div>
            {account.id === currentAdAccountId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}