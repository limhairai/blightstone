"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { CheckSquare, Target, Users, Building2, Calendar, Clock, Plus, ArrowRight, Activity, Trash2 } from "lucide-react"
import { useProjectStore } from "../../lib/stores/project-store"
import { DeleteProjectDialog } from "../projects/delete-project-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { tasksApi, personasApi, competitorsApi, creativesApi, creativeIntelligenceApi } from "@/lib/api"

interface Task {
  id: string
  title: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate: string
  assignee: string
}

export function ProjectDashboardView() {
  const router = useRouter()
  const { getCurrentProject, currentProjectId, removeProject } = useProjectStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Real-time data counts from API
  const [projectCounts, setProjectCounts] = useState({
    tasks: 0,
    completedTasks: 0,
    personas: 0,
    competitors: 0,
    creatives: 0,
    creativeIntelligence: 0
  })
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const currentProject = getCurrentProject()
  
  // Fetch real-time counts for the current project
  useEffect(() => {
    const fetchProjectCounts = async () => {
      if (!currentProjectId) {
        setProjectCounts({
          tasks: 0,
          completedTasks: 0,
          personas: 0,
          competitors: 0,
          creatives: 0,
          creativeIntelligence: 0
        })
        setRecentTasks([])
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        const [tasks, personas, competitors, creatives, creativeIntelligence] = await Promise.all([
          tasksApi.getByProject(currentProjectId),
          personasApi.getByProject(currentProjectId),
          competitorsApi.getByProject(currentProjectId),
          creativesApi.getByProject(currentProjectId),
          creativeIntelligenceApi.getByProject(currentProjectId)
        ])
        
        setProjectCounts({
          tasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          personas: personas.length,
          competitors: competitors.length,
          creatives: creatives.length,
          creativeIntelligence: creativeIntelligence.length
        })
        
        // Store recent tasks for the recent activity section
        setRecentTasks(tasks.slice(0, 3))
      } catch (error) {
        console.error('Error fetching project counts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjectCounts()
  }, [currentProjectId])
  
  const handleProjectDeleted = async (projectId: string) => {
    // Remove project from store (this also clears currentProjectId if it was the deleted project)
    removeProject(projectId)
    
    // Redirect to dashboard to show project selector
    router.push('/dashboard')
  }
  
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Select a project to get started</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-foreground text-background"
      case "paused": return "bg-muted text-muted-foreground border border-border"
      case "completed": return "bg-foreground text-background"
      default: return "bg-muted text-muted-foreground border border-border"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const progressPercentage = getProgressPercentage(currentProject.completedTasks || 0, currentProject.tasksCount || 0)

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{currentProject.name}</h1>
              <Badge className={getStatusColor(currentProject.status)}>
                {currentProject.status}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{currentProject.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {currentProject.createdAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Last activity {currentProject.lastActivity}</span>
          </div>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/tasks">
          <Card className="group hover:bg-[#F5F5F5] transition-colors cursor-pointer border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Tasks</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : projectCounts.tasks}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "..." : `${projectCounts.completedTasks} completed`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/creative-tracker">
          <Card className="group hover:bg-[#F5F5F5] transition-colors cursor-pointer border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Creative Tracker</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : projectCounts.creatives}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Creative campaigns
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/personas">
          <Card className="group hover:bg-[#F5F5F5] transition-colors cursor-pointer border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Personas</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : projectCounts.personas}
                  </p>
                  <p className="text-sm text-muted-foreground">Customer profiles</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/competitors">
          <Card className="group hover:bg-[#F5F5F5] transition-colors cursor-pointer border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Competitors</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : projectCounts.competitors}
                  </p>
                  <p className="text-sm text-muted-foreground">Market analysis</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      {recentTasks.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
              <Link href="/dashboard/tasks">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due {task.dueDate} • {task.assignee || 'Unassigned'}
                    </p>
                  </div>
                  <Badge 
                    className={task.status === 'completed' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground border border-border'}
                  >
                    {task.status.replace('-', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
              {!loading && projectCounts.tasks === 0 && projectCounts.creatives === 0 && projectCounts.personas === 0 && projectCounts.competitors === 0 && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Get started with your project</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first task, persona, or competitor analysis to begin organizing your project.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard/tasks">
                <Button size="sm">Create Task</Button>
              </Link>
              <Link href="/dashboard/personas">
                <Button variant="outline" size="sm">Add Persona</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        project={currentProject ? { id: currentProject.id, name: currentProject.name } : null}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onProjectDeleted={handleProjectDeleted}
      />
    </div>
  )
}