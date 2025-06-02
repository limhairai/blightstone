"use client"

import { useState } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data - replace with actual data from your backend
const organizations = [
  {
    id: "1",
    name: "Stripe",
    avatar: "/abstract-geometric-SP.png",
  },
  {
    id: "2",
    name: "Airwallex",
    avatar: "/abstract-geometric-AW.png",
  },
  {
    id: "3",
    name: "Wise",
    avatar: "/abstract-geometric-WS.png",
  },
]

export function OrganizationSelector() {
  const [selectedOrg, setSelectedOrg] = useState(organizations[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedOrg.avatar} alt={selectedOrg.name} />
              <AvatarFallback className="text-sm">
                {selectedOrg.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{selectedOrg.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center gap-2"
            onClick={() => setSelectedOrg(org)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={org.avatar} alt={org.name} />
              <AvatarFallback className="text-xs">
                {org.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Manage Organizations</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 