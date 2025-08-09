"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { CheckSquare, Target, Users, BarChart3, Calendar, Clock, AlertCircle, TrendingUp } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "completed"
  tasksCount: number
  completedTasks: number
  createdAt: string
  lastActivity: string
}

interface Task {
  id: string
  title: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate: string
  assignee: string
}

export function ProjectDashboardView() {
  // Mock current project data - in real app this would come from project store/API
  const currentProject: Project = {
    id: "1",
    name: "Grounding.co Campaign",
    description: "Complete marketing campaign for grounding products including creative assets, customer research, and competitor analysis",
    status: "active",
    tasksCount: 12,
    completedTasks: 8,
    createdAt: "2025-01-08",
    lastActivity: "2 hours ago"
  }

  // Mock recent tasks - in real app this would come from API
  const recentTasks: Task[] = [
    {
      id: "1",
      title: "Create customer avatar for Persona 1 (Catherine)",
      status: "in-progress",
      priority: "high",
      dueDate: "2025-01-10",
      assignee: "You"
    },
    {
      id: "2",
      title: "Design video ad creative for grounding sheets",
      status: "todo",
      priority: "medium",
      dueDate: "2025-01-12",
      assignee: "Designer"
    },
    {
      id: "3",
      title: "Research top 5 competitors pricing strategies",
      status: "completed",
      priority: "medium",
      dueDate: "2025-01-09",
      assignee: "You"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent text-accent-foreground"
      case "paused": return "bg-muted text-muted-foreground" 
      case "completed": return "bg-primary text-primary-foreground"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-accent text-accent-foreground"
      case "in-progress": return "bg-primary text-primary-foreground"
      case "todo": return "bg-secondary text-secondary-foreground"
      case "blocked": return "bg-muted text-muted-foreground"
      default: return "bg-secondary text-secondary-foreground"
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

  const progressPercentage = getProgressPercentage(currentProject.completedTasks, currentProject.tasksCount)

  return (
    <div className="space-y-6 p-6">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{currentProject.name}</h1>
              <Badge className={getStatusColor(currentProject.status)}>
                {currentProject.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentProject.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {currentProject.createdAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Last activity {currentProject.lastActivity}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4" />
            <span>{currentProject.completedTasks}/{currentProject.tasksCount} tasks completed</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Project Progress</span>
            <span className="font-bold">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div 
              className="bg-accent h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentProject.tasksCount}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentProject.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentTasks.filter(t => t.status === 'in-progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button variant="outline" size="sm">
              View All Tasks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Due: {task.dueDate}</span>
                    <span>Assigned to: {task.assignee}</span>
                  </div>
                </div>
                <Badge className={getTaskStatusColor(task.status)}>
                  {task.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <CheckSquare className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-semibold mb-1">Manage Tasks</h3>
            <p className="text-sm text-muted-foreground">Create and track project tasks</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Target className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-semibold mb-1">Creative Tracker</h3>
            <p className="text-sm text-muted-foreground">Track ad campaigns and creatives</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Users className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-semibold mb-1">Customer Avatars</h3>
            <p className="text-sm text-muted-foreground">Define target customer personas</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <BarChart3 className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-muted-foreground">View project performance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}