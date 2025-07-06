"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { StatusBadge } from "../ui/status-badge"
import { Button } from "../ui/button"
import { getInitials } from "../../utils/format"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { Search, ArrowRight, Building2, Copy, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { LoadingState, ErrorState, EmptyState } from "../ui/states"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { toast } from "sonner"
import { BusinessManager } from "../../types/business"

interface BusinessManagersTableProps {
  businessManagers: BusinessManager[]
  loading: boolean
  onRefresh: () => void
}

export function BusinessManagersTable({ businessManagers, loading, onRefresh }: BusinessManagersTableProps) {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState<BusinessManager | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  const currentMode = theme === "light" ? "light" : "dark"

  const filteredManagers = useMemo(() => {
    let filtered = businessManagers

    if (searchQuery) {
      filtered = filtered.filter(
        (manager) =>
          manager.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((manager) => manager.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "activity":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
  }, [businessManagers, searchQuery, statusFilter, sortBy])

  const handleManagerClick = (manager: BusinessManager) => {
          if (manager.status !== 'active' || !manager.id) {
        return;
      }
    router.push(`/dashboard/accounts?bm_id=${encodeURIComponent(manager.id)}`);
  }

  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(bmId)
    toast.success("Business Manager ID copied to clipboard!")
  }

  const handleDeleteManager = async () => {
    if (!managerToDelete) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/business-managers?id=${managerToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete Business Manager');
      }
      setDeleteDialogOpen(false)
      setManagerToDelete(null)
      onRefresh()
      toast.success("Business Manager deleted successfully!")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error("Deletion Failed", { description: errorMessage });
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (manager: BusinessManager, e: React.MouseEvent) => {
    e.stopPropagation()
    setManagerToDelete(manager)
    setDeleteDialogOpen(true)
  }

  if (loading && businessManagers.length === 0) {
    return <LoadingState message="Loading business managers..." />
  }

  return (
    <div className="space-y-4">
      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or BM ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Last Activity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid and List Views */}
      <div className="space-y-1.5">
          {filteredManagers.map((manager) => (
            <div
              key={manager.id}
              onClick={() => handleManagerClick(manager)}
              className={cn(
                "bg-card border rounded-lg p-3 shadow-sm transition-all group",
                manager.status === "active"
                  ? "cursor-pointer hover:shadow-md hover:bg-card/95"
                  : "cursor-not-allowed opacity-60 bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex-shrink-0", getBusinessAvatarClasses(manager.name, currentMode), "flex items-center justify-center font-bold")}>
                    {getInitials(manager.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{manager.name}</div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2">
                      <StatusBadge status={manager.status} />
                      <span>•</span>
                      <span>ID: {manager.dolphin_business_manager_id || 'N/A'}</span>
                      <span>•</span>
                      <span>Created {new Date(manager.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => copyBmId(manager.dolphin_business_manager_id || '', e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy BM ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => openDeleteDialog(manager, e)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          ))}
        </div>

      {filteredManagers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">No business managers found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Apply for your first business manager to get started"}
          </p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the Business Manager record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteManager}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 