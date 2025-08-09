"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { ChevronDown, Search, FolderOpen, Plus, Loader2, Check } from "lucide-react"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"
import { useProjectStore, Project } from "../../lib/stores/project-store"
import ProjectCreationDialog from "./project-creation-dialog"

export function ProjectSelector() {
  const { theme } = useTheme()
  const router = useRouter()
  const { currentProjectId, setCurrentProjectId, projects, getCurrentProject, getProjectWithDynamicCounts } = useProjectStore()
  const { session, user } = useAuth()
  const currentTheme = (theme === "dark" || theme === "light") ? theme : "light"
  
  const [componentIsLoading, setComponentIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const currentProject = currentProjectId ? getProjectWithDynamicCounts(currentProjectId) : null

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, projects])

  const handleProjectSelect = useCallback((projectId: string) => {
    if (projectId === currentProjectId) return
    
    setComponentIsLoading(true)
    setCurrentProjectId(projectId)
    setIsDropdownOpen(false)
    
    // In real app, this would trigger data refetch for the new project
    setTimeout(() => {
      setComponentIsLoading(false)
    }, 500)
  }, [currentProjectId, setCurrentProjectId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent text-accent-foreground"
      case "paused": return "bg-muted text-muted-foreground" 
      case "completed": return "bg-primary text-primary-foreground"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  if (!currentProject) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
        <span>No Project</span>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between px-3 py-2 h-auto hover:bg-[#F5F5F5]/10"
          disabled={componentIsLoading}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium text-foreground truncate">
                  {currentProject.name}
                </span>
                <Badge className={cn("text-xs", getStatusColor(currentProject.status))} variant="secondary">
                  {currentProject.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                <span>{getProgressPercentage(currentProject.completedTasks || 0, currentProject.tasksCount || 0)}% complete</span>
                <span>•</span>
                <span>{currentProject.completedTasks}/{currentProject.tasksCount} tasks</span>
              </div>
            </div>
          </div>
          {componentIsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Switch Project
        </DropdownMenuLabel>
        
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        <div className="max-h-60 overflow-y-auto">
          {filteredProjects.map((project) => {
            const projectWithCounts = getProjectWithDynamicCounts(project.id) || project
            return (
            <DropdownMenuItem
              key={project.id}
              className="flex items-center gap-3 p-3 cursor-pointer"
              onSelect={() => handleProjectSelect(project.id)}
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <div className="flex-shrink-0">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{project.name}</span>
                  <Badge className={cn("text-xs", getStatusColor(project.status))} variant="secondary">
                    {project.status}
                  </Badge>
                  {project.id === currentProjectId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                

                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getProgressPercentage(projectWithCounts.completedTasks || 0, projectWithCounts.tasksCount || 0)}% complete</span>
                  <span>•</span>
                  <span>{projectWithCounts.completedTasks}/{projectWithCounts.tasksCount} tasks</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${getProgressPercentage(projectWithCounts.completedTasks || 0, projectWithCounts.tasksCount || 0)}%` }}
                  />
                </div>
              </div>
            </DropdownMenuItem>
            )
          })}
        </div>

        <Separator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 p-3 cursor-pointer"
          onSelect={() => {
            setIsDropdownOpen(false)
            setIsCreateDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Create New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      
      <ProjectCreationDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  )
}