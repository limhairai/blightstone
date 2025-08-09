"use client"

import type React from "react"
import { cn } from "../../../lib/utils"
import Link from "next/link"
import { usePageTitle } from "../../../components/core/simple-providers"
import { usePathname } from "next/navigation"
import { Badge } from "../../../components/ui/badge"
import { Copy, Edit, Check, X } from 'lucide-react'
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useCurrentOrganization } from "@/lib/swr-config"
import { useSubscription } from "@/hooks/useSubscription"
import { gradientTokens } from "../../../lib/design-tokens"
import { Skeleton } from "@/components/ui/skeleton"
import { useSWRConfig } from "swr"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const { setPageTitle } = usePageTitle()
  const { currentOrganizationId } = useOrganizationStore();
  const { session } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  
  // ⚡ INSTANT LOADING: Use prefetched organization data
  const { data, error, isLoading, mutate } = useCurrentOrganization(currentOrganizationId);
  const currentOrganization = data?.organizations?.[0];
  
  // ⚡ INSTANT LOADING: Use prefetched subscription data
  const { currentPlan, isLoading: isSubscriptionLoading } = useSubscription();
  const planName = currentPlan?.name || 'Free';

  // Organization name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPageTitle("Settings")
  }, [setPageTitle])

  // Initialize editing name when organization changes
  useEffect(() => {
    if (currentOrganization?.name) {
      setEditingName(currentOrganization.name);
    }
  }, [currentOrganization?.name]);

  const handleStartEditing = () => {
    setEditingName(currentOrganization?.name || '');
    setIsEditingName(true);
  };

  const handleCancelEditing = () => {
    setEditingName(currentOrganization?.name || '');
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    if (editingName.trim() === currentOrganization?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations?id=${currentOrganizationId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name: editingName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Organization update failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to update organization name (${response.status})`);
      }
      
      // Refresh the organization data
      await mutate();
      
      // Invalidate all organization-related SWR caches (including admin panel)
      globalMutate((key) => {
        if (typeof key === 'string') {
          return key.includes('/api/organizations') || key.includes('/api/admin/organizations');
        }
        if (Array.isArray(key)) {
          return key.some(k => typeof k === 'string' && (k.includes('/api/organizations') || k.includes('/api/admin/organizations')));
        }
        return false;
      });
      
      toast.success("Organization name updated successfully");
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating organization name:', error);
      toast.error("Failed to update organization name");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { name: "Organization", href: "/dashboard/settings" },
    { name: "Team", href: "/dashboard/settings/team" },
    { name: "Account", href: "/dashboard/settings/account" },
  ]
  
  if (isLoading) {
    return (
        <div className="max-w-full mx-auto py-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
    )
  }

  if (error) {
    return (
        <div className="max-w-full mx-auto py-4">
            <div className="text-center text-muted-foreground">
                Failed to load organization settings
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-full mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Organization Avatar */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${gradientTokens.avatar}`}>
            {currentOrganization?.name 
              ? currentOrganization.name.split(' ').map((word: string) => word.charAt(0)).join('').slice(0, 2).toUpperCase()
              : 'ORG'
            }
          </div>
          
          {/* Organization Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="text-2xl font-bold h-9 border-border focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEditing();
                      }
                    }}
                    autoFocus
                    disabled={isSaving}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                    onClick={handleSaveName}
                    disabled={isSaving}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentOrganization?.name || 'Organization Settings'}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 py-1 text-xs opacity-60 group-hover:opacity-100 hover:bg-accent transition-opacity"
                    onClick={handleStartEditing}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your organization preferences and team settings
            </p>
          </div>
        </div>
        
        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium px-3 py-1.5 bg-muted border-[#b4a0ff]/20 text-foreground",
              "hover:from-[#b4a0ff]/20 hover:to-[#ffb4a0]/20 transition-all duration-200"
            )}
          >
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
            {planName}
          </Badge>
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  )
} 