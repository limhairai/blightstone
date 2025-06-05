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
import { ThemeToggleButton } from "@/components/core/theme-toggle-button";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Organization {
  id: string;
  name: string;
  avatar?: string;
  role?: string; 
  planId?: string; 
}

interface OrganizationSwitcherProps {
  className?: string;
  collapsed?: boolean; 
}

export function OrganizationSwitcher({
  className,
  collapsed = false,
}: OrganizationSwitcherProps) {
  const { organizations, currentOrg, setCurrentOrg, loading: orgLoading, error: orgError, mutate: mutateOrganizations } = useOrganization();
  const { user, session } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false); 
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
      const token = session?.access_token;

      if (!token) {
        setCreateOrgError("Authentication token not found. Please log in again.");
        toast({ title: "Error", description: "Authentication token not found. Please log in again.", variant: "destructive" });
        setIsCreatingOrg(false);
        return;
      }
      
      const response = await fetch("/api/proxy/v1/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newOrgName,
          adSpend: { monthly: "", platforms: [] }, 
          supportChannel: { type: "", handle: "" }, 
        }),
      });

      const createdOrgData = await response.json();

      if (!response.ok) {
        throw new Error(createdOrgData.detail || "Failed to create organization");
      }

      console.log("Organization created successfully:", createdOrgData);
      toast({ title: "Organization Created", description: `Successfully created ${createdOrgData.name}.` });
      
      mutateOrganizations(); 
      
      if (setCurrentOrg && createdOrgData && createdOrgData.id) {
         const newOrgForContext: Organization = {
            id: createdOrgData.id,
            name: createdOrgData.name,
            role: createdOrgData.role || "owner", 
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

  const getTierGradient = (planId?: string) => {
    switch (planId?.toLowerCase()) {
      case "bronze": return "linear-gradient(to bottom, #FFC27A 0%, #7F462C 47%, #CC9966 100%)";
      case "silver": return "linear-gradient(to bottom, #E0E8FF 0%, #A8B8D8 47%, #C0D0F0 100%)";
      case "gold": return "linear-gradient(to bottom, #FFF7B2 0%, #FFD700 47%, #FFEC8B 100%)";
      case "platinum": return "linear-gradient(to bottom, #FFFFFF 0%, #E5E4E2 30%, #C9C0BB 50%, #E5E4E2 70%, #FFFFFF 100%)";
      default: return "linear-gradient(to bottom, rgba(128,128,128,0.2), rgba(128,128,128,0.05))"; 
    }
  };

  if (!mounted || orgLoading) {
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
    if (setCurrentOrg) setCurrentOrg(organizations[0]);
    return <div className={cn("p-2 text-xs text-muted-foreground", className)}>Selecting org...</div>; 
  }
  
  if (!currentOrg) {
      return (
        <Button variant="outline" className={cn("w-full justify-between border-muted bg-background truncate", className)} disabled>
          No Org Selected
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      );
  }

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
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create New Organization</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <Label htmlFor="newOrgNameModal">Organization Name</Label>
                        <Input id="newOrgNameModal" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} />
                      </div>
                      <Button onClick={handleCreateOrgAPI} disabled={isCreatingOrg}>
                        {isCreatingOrg ? "Creating..." : "Create Organization"}
                      </Button>
                      {createOrgError && <p className="text-destructive text-sm mt-2">{createOrgError}</p>}
                    </DialogContent>
                 </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

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
            <div className="flex items-center truncate pl-2.5">
              <Avatar className="h-7 w-7 mr-2.5">
                <AvatarImage src={currentOrg.avatar || "/placeholder.svg"} alt={currentOrg.name} />
                <AvatarFallback>{currentOrg.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-sm text-foreground">
                {currentOrg.name}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 opacity-70 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2 bg-background border-border shadow-lg">
          <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">Organizations</DropdownMenuLabel>
          {organizations?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSelectOrg(org)}
              className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-muted focus:bg-muted"
            >
              <div className="flex items-center truncate">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                  <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium text-foreground">{org.name}</span>
              </div>
              {currentOrg.id === org.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-2" />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                className="flex items-center cursor-pointer p-2 rounded-md hover:bg-muted focus:bg-muted"
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-foreground">Create Organization</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Create New Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="newOrgNameDialog" className="text-sm font-medium text-muted-foreground">
                    Organization Name
                  </Label>
                  <Input
                    id="newOrgNameDialog"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="E.g. Acme Corp"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleCreateOrgAPI} disabled={isCreatingOrg} className="w-full mt-2">
                {isCreatingOrg ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : "Create Organization"}
              </Button>
              {createOrgError && <p className="text-destructive text-sm mt-2 text-center">{createOrgError}</p>}
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem 
            onClick={() => alert("Navigate to Settings page or open settings modal/drawer.")} 
            className="flex items-center cursor-pointer p-2 rounded-md hover:bg-muted focus:bg-muted"
          >
            <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-foreground">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 