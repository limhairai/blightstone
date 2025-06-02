"use client"

import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggleButton } from "./theme-toggle-button"; // Assuming this exists or is the same as theme-toggle
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
// import { OrganizationForm } from "@/components/onboarding/organization-form"; // For later when adding create org modal

// Interface for Organization, ensure it matches what OrganizationContext provides
interface Organization {
  id: string;
  name: string;
  avatar?: string;
  role?: string; // Role of the current user in this org
  planId?: string; // Or tier, ensure consistency
}

interface OrganizationSwitcherProps {
  className?: string;
  collapsed?: boolean; // For collapsed state in sidebar
}

export function OrganizationSwitcher({
  className,
  collapsed = false,
}: OrganizationSwitcherProps) {
  const { organizations, currentOrg, setCurrentOrg, loading: orgLoading, error: orgError, mutate: mutateOrganizations } = useOrganization();
  const { user } = useAuth(); // Get user for token
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false); // Loading state for org creation
  const [createOrgError, setCreateOrgError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectOrg = (org: Organization) => {
    if (setCurrentOrg) {
      setCurrentOrg(org);
    }
  };

  const handleCreateOrgAPI = async () => {
    if (!newOrgName.trim()) {
      setCreateOrgError("Organization name cannot be empty.");
      return;
    }
    if (!user) {
      setCreateOrgError("User not authenticated.");
      return;
    }

    setIsCreatingOrg(true);
    setCreateOrgError("");

    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/proxy/v1/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newOrgName,
          // Send minimal data for creating a new org outside onboarding
          // The backend OrganizationOnboarding model might need to allow optional adSpend & supportChannel
          // Or, we send empty/default structures for them if required by backend Pydantic model.
          adSpend: { monthly: "", platforms: [] }, // Example default
          supportChannel: { type: "", handle: "" }, // Example default
        }),
      });

      const createdOrgData = await response.json();

      if (!response.ok) {
        throw new Error(createdOrgData.detail || "Failed to create organization");
      }

      console.log("Organization created successfully:", createdOrgData);
      toast({ title: "Organization Created", description: `Successfully created ${createdOrgData.name}.` });
      
      mutateOrganizations(); // Revalidate SWR data for organizations to update the list
      
      // Optionally, set the new org as current immediately
      // Ensure createdOrgData from backend matches the Organization interface used by setCurrentOrg
      if (setCurrentOrg && createdOrgData && createdOrgData.id) {
         const newOrgForContext: Organization = {
            id: createdOrgData.id,
            name: createdOrgData.name,
            role: createdOrgData.role || "owner", // Assuming backend returns role
            planId: createdOrgData.planId || "bronze",
            avatar: createdOrgData.avatar
         };
         setCurrentOrg(newOrgForContext);
      }

      setNewOrgName("");
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      console.error("Error creating organization:", err);
      setCreateOrgError(err.message || "An unexpected error occurred.");
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  // Tier gradient logic from organization-selector.tsx (can be moved to a util or kept here)
  const getTierGradient = (planId?: string) => {
    switch (planId?.toLowerCase()) {
      case "bronze": return "linear-gradient(to bottom, #FFC27A 0%, #7F462C 47%, #CC9966 100%)";
      case "silver": return "linear-gradient(to bottom, #E0E8FF 0%, #A8B8D8 47%, #C0D0F0 100%)";
      case "gold": return "linear-gradient(to bottom, #FFF7B2 0%, #FFD700 47%, #FFEC8B 100%)";
      case "platinum": return "linear-gradient(to bottom, #FFFFFF 0%, #E5E4E2 30%, #C9C0BB 50%, #E5E4E2 70%, #FFFFFF 100%)";
      default: return "linear-gradient(to bottom, rgba(128,128,128,0.2), rgba(128,128,128,0.05))"; // Default subtle gray
    }
  };

  if (!mounted || orgLoading) {
    // Simplified loading state, can be a skeleton later
    return (
      <Button variant="outline" className={cn("w-full justify-between border-muted bg-background truncate", className)} disabled>
        Loading Orgs...
        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
      </Button>
    );
  }

  if (orgError) {
    return <div className="text-xs text-destructive p-2">Error loading orgs.</div>;
  }

  if (!currentOrg && organizations && organizations.length === 0) {
     // UI for when user has no organizations yet, prompt to create
    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={cn("w-full", className)}>
            <Plus className="h-4 w-4 mr-2" /> Create Org
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Your First Organization</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="newOrgName">Organization Name</Label>
            <Input id="newOrgName" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} />
          </div>
          <Button onClick={handleCreateOrgAPI} disabled={isCreatingOrg}>
            {isCreatingOrg ? "Creating..." : "Create"}
          </Button>
          {createOrgError && <p className="text-destructive text-sm mt-2">{createOrgError}</p>}
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!currentOrg && (!organizations || organizations.length === 0)) {
    return <div className={cn("p-2 text-xs text-muted-foreground", className)}>No organization.</div>
  }

  if (!currentOrg && organizations && organizations.length > 0) {
    // This case should ideally be handled by OrganizationContext defaulting currentOrg
    // For safety, if currentOrg is null but orgs exist, pick the first one.
    if (setCurrentOrg) setCurrentOrg(organizations[0]);
    return <div className={cn("p-2 text-xs text-muted-foreground", className)}>Selecting org...</div>; 
  }
  
  if (!currentOrg) {
      // Fallback if currentOrg is somehow still null despite other checks
      // This might happen if organizations array is empty initially
      return (
        <Button variant="outline" className={cn("w-full justify-between border-muted bg-background truncate", className)} disabled>
          No Org Selected
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      );
  }

  // Collapsed view (icon only)
  if (collapsed) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className={cn(className)}>
                <Button variant="ghost" className="w-10 h-10 p-0 rounded-full flex items-center justify-center">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={currentOrg.avatar || "/placeholder.svg"} alt={currentOrg.name} />
                        <AvatarFallback>{currentOrg.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                {organizations?.map((org) => (
                    <DropdownMenuItem key={org.id} onClick={() => handleSelectOrg(org)} className="cursor-pointer">
                        <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                            <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{org.name}</span>
                        {currentOrg.id === org.id && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                 <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                            <Plus className="h-4 w-4 mr-2" /> Create Organization
                        </DropdownMenuItem>
                    </DialogTrigger>
                    {/* DialogContent for create org - same as below */}
                 </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  // Full view (name and dropdown chevron)
  return (
    <div className={cn("relative w-full", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background/80 border-border relative overflow-hidden h-12 px-3"
          >
            <div
              className="absolute top-0 left-0 w-1.5 h-full"
              style={{
                background: getTierGradient(currentOrg.planId),
                boxShadow: currentOrg.planId ? "0 0 4px rgba(255,255,255,0.2)" : "none",
              }}
            />
            <div className="flex items-center pl-3">
              <Avatar className="h-7 w-7 mr-2.5">
                <AvatarImage src={currentOrg.avatar || "/placeholder.svg"} alt={currentOrg.name} />
                <AvatarFallback>{currentOrg.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                 <span className="text-sm font-medium truncate max-w-[150px]">{currentOrg.name}</span>
                 {currentOrg.role && <span className="text-xs text-muted-foreground capitalize">{currentOrg.role}</span>}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
          <DropdownMenuLabel className="px-3">Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[200px] overflow-y-auto">
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className={`flex items-center py-2 px-3 cursor-pointer ${currentOrg.id === org.id ? "bg-muted" : ""}`}
                onClick={() => handleSelectOrg(org)}
              >
                <Avatar className="h-7 w-7 mr-2">
                    <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                    <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium truncate max-w-[160px]">{org.name}</span>
                    {org.role && <span className="text-xs text-muted-foreground capitalize">{org.role}</span>}
                </div>
                {currentOrg.id === org.id && <Check className="h-4 w-4 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <div className="px-1 py-1">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center py-2 px-3 cursor-pointer hover:bg-muted focus:bg-muted rounded-sm"
                  onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Create Organization</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newOrgName">Organization Name</Label>
                    <Input
                      id="newOrgName"
                      placeholder="Your Company Name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                  {/* TODO: Add more fields if needed for org creation (e.g., plan selection) */}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrgAPI} disabled={isCreatingOrg}>
                    {isCreatingOrg ? "Creating..." : "Create"}
                  </Button>
                </div>
                {createOrgError && <p className="text-destructive text-sm mt-2">{createOrgError}</p>}
              </DialogContent>
            </Dialog>
          </div>
          {/* Settings and Theme Toggle - can be separate components or part of a user menu */}
          {/* <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center py-2 px-3 cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            <span>Manage Organizations</span>
          </DropdownMenuItem>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Appearance</span>
            <ThemeToggleButton />
          </div> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 