"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAppData } from "@/contexts/AppDataContext";
import { contentTokens } from "@/lib/content-tokens"

interface OrganizationSwitcherProps {
  className?: string
}

export function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const { organizations, currentOrg, setCurrentOrg, loading, createOrganization } = useAppData();
  const [open, setOpen] = useState(false)
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return
    
    setIsCreating(true)
    try {
      await createOrganization(newOrgName.trim())
      setNewOrgName("")
      setShowNewOrgDialog(false)
      setOpen(false)
    } catch (error) {
      console.error('Failed to create organization:', error)
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className={cn("w-[200px] justify-between", className)}
        >
          {currentOrg?.name || "Select organization..."}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organizations..." />
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    setCurrentOrg(org)
                    setOpen(false)
                  }}
                  className="text-sm"
                >
                  {org.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentOrg?.id === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  setShowNewOrgDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      
      {/* Simple inline create dialog */}
      {showNewOrgDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create Organization</h3>
            <input
              type="text"
              placeholder="Organization name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateOrganization()
                if (e.key === 'Escape') setShowNewOrgDialog(false)
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewOrgDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
              >
                {isCreating ? contentTokens.loading.creating : contentTokens.actions.create}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Popover>
  )
} 