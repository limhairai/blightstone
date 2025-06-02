"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useOrganization } from "@/components/organization-context"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useWallet } from "@/contexts/WalletContext"
import { Checkbox } from "@/components/ui/checkbox"
import type { CheckedState, CheckboxProps } from "@radix-ui/react-checkbox"
import type { ComponentProps } from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader } from "@/components/Loader"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Project {
  id: string
  name: string
  websiteUrl: string
  status: "pending" | "approved" | "rejected"
  adAccountIds: string[]
  allowedUsers: string[]
  limit?: number
  orgId: string
}

const TypedCheckbox = Checkbox as React.FC<ComponentProps<typeof Checkbox>>

export function ProjectsTable() {
  const { currentOrg } = useOrganization()
  const { adAccounts } = useWallet()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDomains, setNewDomains] = useState("")
  const [newFacebookPageUrl, setNewFacebookPageUrl] = useState("")
  const [newTimezone, setNewTimezone] = useState("")
  const [newAllowedUsers, setNewAllowedUsers] = useState<string[]>([])
  const [newLimit, setNewLimit] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState("")
  const [editDomain, setEditDomain] = useState("")
  const [editUsers, setEditUsers] = useState("")
  const [editLimit, setEditLimit] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignProject, setAssignProject] = useState<Project | null>(null)
  const [assignSelected, setAssignSelected] = useState<string[]>([])
  const [assignSearch, setAssignSearch] = useState("")
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    if (!currentOrg?.id) return
    setLoading(true)
    setError("")
    const token = typeof window !== 'undefined' ? localStorage.getItem('adhub_token') : null;
    fetch(`/api/v1/projects?orgId=${currentOrg.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch projects")
        return res.json()
      })
      .then(data => setProjects(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [currentOrg?.id])

  useEffect(() => {
    if (!currentOrg?.id) return
    setMembersLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('adhub_token') : null;
    fetch(`/api/v1/organizations/${currentOrg.id}/members`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMembers(data)
        else setMembers([])
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false))
  }, [currentOrg?.id])

  const openEditModal = useCallback((project: Project) => {
    setEditProject(project)
    setEditName(project.name)
    setEditDomain(project.websiteUrl)
    setEditUsers(project.allowedUsers.join(", "))
    setEditLimit(project.limit ? String(project.limit) : "")
    setEditOpen(true)
  }, [])

  const openAssignModal = useCallback((project: Project) => {
    setAssignProject(project)
    setAssignSelected(project.adAccountIds)
    setAssignOpen(true)
    setAssignSearch("")
  }, [])

  const handleAddProject = async () => {
    if (!newName.trim()) {
      toast({ title: "Project name is required", variant: "destructive" })
      return
    }
    if (!newDomains.trim()) {
      toast({ title: "Domain(s) are required", variant: "destructive" })
      return
    }
    if (!newFacebookPageUrl.trim()) {
      toast({ title: "Facebook Page URL is required", variant: "destructive" })
      return
    }
    if (!newTimezone.trim()) {
      toast({ title: "Timezone is required", variant: "destructive" })
      return
    }
    if (!currentOrg) {
      toast({ title: "No organization selected", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          domains: newDomains.split(",").map(d => d.trim()).filter(Boolean),
          facebookPageUrl: newFacebookPageUrl,
          timezone: newTimezone,
          allowedUsers: newAllowedUsers,
          limit: newLimit ? parseFloat(newLimit) : undefined,
          adAccountIds: [],
          orgId: currentOrg.id,
        }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      const project = await res.json()
      setProjects([project, ...projects])
      setAddOpen(false)
      setNewName("")
      setNewDomains("")
      setNewFacebookPageUrl("")
      setNewTimezone("")
      setNewAllowedUsers([])
      setNewLimit("")
      toast({ title: "Project created" })
    } catch (err: any) {
      toast({ title: err.message || "Failed to create project", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProject = async () => {
    if (!editProject) return
    if (!editName.trim()) {
      toast({ title: "Project name is required", variant: "destructive" })
      return
    }
    if (!editDomain.trim()) {
      toast({ title: "Website URL is required", variant: "destructive" })
      return
    }
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/v1/projects/${editProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          websiteUrl: editDomain,
          allowedUsers: editUsers.split(",").map(u => u.trim()).filter(Boolean),
          limit: editLimit ? parseFloat(editLimit) : undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to update project")
      const updated = await res.json()
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setEditOpen(false)
      setEditProject(null)
      toast({ title: "Project updated" })
    } catch (err: any) {
      toast({ title: err.message || "Failed to update project", variant: "destructive" })
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Delete project '${project.name}'? This cannot be undone.`)) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
      setProjects(projects.filter(p => p.id !== project.id))
      toast({ title: "Project deleted" })
    } catch (err: any) {
      toast({ title: err.message || "Failed to delete project", variant: "destructive" })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleAssignSubmit = async () => {
    if (!assignProject) return
    setAssignSubmitting(true)
    try {
      const res = await fetch(`/api/v1/projects/${assignProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountIds: assignSelected }),
      })
      if (!res.ok) throw new Error("Failed to update project accounts")
      const updated = await res.json()
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setAssignOpen(false)
      setAssignProject(null)
      toast({ title: "Project accounts updated" })
    } catch (err: any) {
      toast({ title: err.message || "Failed to update project accounts", variant: "destructive" })
    } finally {
      setAssignSubmitting(false)
    }
  }

  if (loading) return (
    <div className="p-8">
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-full mb-2" />
    </div>
  )
  if (error) return (
    <div className="p-8 max-w-md mx-auto">
      <Alert variant="destructive">
        <AlertTitle>Error loading projects</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={refresh}>Retry</Button>
      </Alert>
    </div>
  )
  if (projects.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon bg-muted">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-lg font-semibold mb-2">No projects yet</div>
      <div className="text-muted-foreground mb-4">Get started by creating your first project.</div>
      <Button onClick={handleAddProject} className="transition-all">Create Project</Button>
    </div>
  )

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button size="sm" className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="bg-[#0f0a14] border-[#2C2C2E] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#b4a0ff] to-[#f8c4b4] text-transparent bg-clip-text">
                Add Project
              </DialogTitle>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleAddProject(); }}>
              <div className="pb-0">
                {error && <div className="bg-red-900 text-red-200 rounded p-3 mb-4 text-sm">{error}</div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Project Name</label>
                  <Input
                    placeholder="Project name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Domains (comma separated)</label>
                  <Input
                    placeholder="Domains (comma separated)"
                    value={newDomains}
                    onChange={e => setNewDomains(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Facebook Page URL (optional)</label>
                  <Input
                    placeholder="Facebook Page URL (optional)"
                    value={newFacebookPageUrl}
                    onChange={e => setNewFacebookPageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Timezone (e.g. UTC, PST)</label>
                  <Input
                    placeholder="Timezone (e.g. UTC, PST)"
                    value={newTimezone}
                    onChange={e => setNewTimezone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 flex flex-row gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-[#b4a0ff] to-[#f8c4b4] text-black font-semibold px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4" aria-describedby="edit-project-desc">
              <span id="edit-project-desc" className="sr-only">Edit the details of your project below.</span>
              <Input
                placeholder="Project name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                disabled={editSubmitting}
              />
              <Input
                placeholder="Website URL"
                value={editDomain}
                onChange={e => setEditDomain(e.target.value)}
                disabled={editSubmitting}
              />
              <Input
                placeholder="Allowed users (comma-separated emails)"
                value={editUsers}
                onChange={e => setEditUsers(e.target.value)}
                disabled={editSubmitting}
              />
              <Input
                placeholder="Limit (optional)"
                type="number"
                value={editLimit}
                onChange={e => setEditLimit(e.target.value)}
                disabled={editSubmitting}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleEditProject} disabled={editSubmitting}>
                {editSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Ad Accounts</DialogTitle>
              <DialogDescription>
                Select which ad accounts should belong to this project.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Search accounts..."
              value={assignSearch}
              onChange={e => setAssignSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-[#18181b]">
              {adAccounts
                .filter((a: any) => a.name?.toLowerCase().includes(assignSearch.toLowerCase()) || a.id?.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 py-1">
                    {/* @ts-expect-error Radix JSX type issue */}
                    <CheckboxPrimitive.Root
                      checked={assignSelected.includes(a.id)}
                      onCheckedChange={(checked: CheckedState) => {
                        const isChecked = checked === true
                        setAssignSelected(isChecked ? [...assignSelected, a.id] : assignSelected.filter(id => id !== a.id))
                      }}
                      id={`assign-account-${a.id}`}
                      className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    >
                      {/* @ts-expect-error Radix JSX type issue */}
                      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                        <span className="block w-3 h-3 bg-primary rounded-sm" />
                      </CheckboxPrimitive.Indicator>
                    </CheckboxPrimitive.Root>
                    <label htmlFor={`assign-account-${a.id}`} className="text-sm cursor-pointer">
                      {a.name} <span className="text-xs text-muted-foreground ml-2">{a.id}</span>
                    </label>
                  </div>
                ))}
            </div>
            <DialogFooter>
              <Button onClick={handleAssignSubmit} disabled={assignSubmitting}>
                {assignSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="py-2 px-4 text-left">Group Name</th>
                <th className="py-2 px-4 text-left">Website URL</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left"># of Ad Accounts</th>
                <th className="py-2 px-4 text-left">Limit</th>
                <th className="py-2 px-4 text-left">Allowed Users</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-[#222] hover:bg-[#18181b]">
                  <td className="py-2 px-4 font-medium">{project.name}</td>
                  <td className="py-2 px-4">{project.websiteUrl}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${project.status === "approved" ? "bg-green-900 text-green-300" : project.status === "pending" ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                  </td>
                  <td className="py-2 px-4">{project.adAccountIds.length}</td>
                  <td className="py-2 px-4">{project.limit ? `${project.limit}` : "-"}</td>
                  <td className="py-2 px-4">
                    {project.allowedUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.allowedUsers.slice(0, 3).map((user, i) => (
                          <span key={i} className="bg-[#222] rounded px-2 py-0.5 text-xs">{user}</span>
                        ))}
                        {project.allowedUsers.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{project.allowedUsers.length - 3} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(project)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAssignModal(project)}>Assign Accounts</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteProject(project)} disabled={deleteSubmitting}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 