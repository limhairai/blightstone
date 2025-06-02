"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Plus, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggleButton } from "./theme-toggle-button"

interface Organization {
  id: string
  name: string
  avatar?: string
  role: string
  tier?: "bronze" | "silver" | "gold" | "platinum" | null
}

export function OrganizationSelector() {
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: "1",
      name: "Personal Account",
      role: "Owner",
      tier: null,
    },
    {
      id: "2",
      name: "Acme Corporation",
      avatar: "/air-conditioner-unit.png",
      role: "Admin",
      tier: "bronze",
    },
    {
      id: "3",
      name: "Startup Project",
      avatar: "/abstract-geometric-SP.png",
      role: "Member",
      tier: "silver",
    },
    {
      id: "4",
      name: "Enterprise Solutions",
      role: "Admin",
      tier: "gold",
    },
    {
      id: "5",
      name: "Global Ventures",
      role: "Owner",
      tier: "platinum",
    },
  ])

  const [selectedOrg, setSelectedOrg] = useState<Organization>(organizations[2])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateOrg = () => {
    if (newOrgName.trim()) {
      const newOrg: Organization = {
        id: Date.now().toString(),
        name: newOrgName,
        role: "Owner",
        tier: "bronze", // Default tier for new organizations
      }
      setOrganizations([...organizations, newOrg])
      setSelectedOrg(newOrg)
      setNewOrgName("")
      setIsCreateDialogOpen(false)
    }
  }

  // Enhanced metallic gradients for tiers with more pronounced differences
  const getTierGradient = (tier: Organization["tier"]) => {
    switch (tier) {
      case "bronze":
        return "linear-gradient(to bottom, #FFC27A 0%, #7F462C 47%, #CC9966 100%)"
      case "silver":
        // More blue-tinted silver to distinguish from platinum
        return "linear-gradient(to bottom, #E0E8FF 0%, #A8B8D8 47%, #C0D0F0 100%)"
      case "gold":
        return "linear-gradient(to bottom, #FFF7B2 0%, #FFD700 47%, #FFEC8B 100%)"
      case "platinum":
        // More rainbow/iridescent effect for platinum
        return "linear-gradient(to bottom, #FFFFFF 0%, #E5E4E2 30%, #C9C0BB 50%, #E5E4E2 70%, #FFFFFF 100%)"
      default:
        return "linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.05))"
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" className="w-full justify-between border-muted bg-background">
        <div className="flex items-center">
          <span className="truncate max-w-[180px]">Loading...</span>
        </div>
        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
      </Button>
    )
  }

  return (
    <div className="relative w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background/80 border-border relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 w-2 h-full"
              style={{
                background: getTierGradient(selectedOrg.tier),
                boxShadow: selectedOrg.tier ? "0 0 5px rgba(255,255,255,0.3)" : "none",
              }}
            />
            <div className="flex items-center pl-2">
              <span className="truncate max-w-[180px]">{selectedOrg.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[260px]">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              className={`flex items-center py-2 px-3 cursor-pointer ${selectedOrg.id === org.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedOrg(org)}
            >
              <div className="flex items-center flex-1">
                <Avatar className="h-8 w-8 mr-2">
                  {org.avatar ? (
                    <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                  ) : (
                    <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[160px]">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.role}</span>
                </div>
              </div>
              {selectedOrg.id === org.id && <Check className="h-4 w-4 ml-2 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Appearance</span>
              <ThemeToggleButton />
            </div>
          </div>
          <DropdownMenuSeparator />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="flex items-center py-2 px-3 cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Create Organization</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrg}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuItem className="flex items-center py-2 px-3 cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            <span>Manage Organizations</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
