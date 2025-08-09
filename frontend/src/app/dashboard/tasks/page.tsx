"use client"

import { TableCell } from "@/components/ui/table"

import { TableBody } from "@/components/ui/table"

import { TableHead } from "@/components/ui/table"

import { TableRow } from "@/components/ui/table"

import { TableHeader } from "@/components/ui/table"

import { Table } from "@/components/ui/table"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, User, Calendar, Filter } from "lucide-react"
import TaskBriefPage from "@/components/tasks/task-brief-page" // Import the new component
import { useProjectStore } from "@/lib/stores/project-store"

// Task interface
interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: string
  dueDate: string
  createdAt: string
  category: string
}

// Define a constant for a new task's temporary ID
const NEW_TASK_ID = "new-task-temp-id"

export default function TasksPage() {
  const { currentProjectId } = useProjectStore()
  
  // Project-specific mock data
  const getTasksForCurrentProject = () => {
    if (currentProjectId === "1") {
      // Grounding.co Campaign tasks
      return [
        {
          id: "1",
          title: "Create customer avatar for Persona 1 (Catherine)",
          description: "Develop detailed customer avatar including pain points, desires, and objections for the mom persona. This will involve interviewing existing customers and analyzing market research data. The final output should be a comprehensive document.",
          status: "in-progress" as Task["status"],
          priority: "high" as Task["priority"],
          assignee: "You",
          dueDate: "2025-01-10",
          createdAt: "2025-01-08",
          category: "Research",
        },
        {
          id: "2", 
          title: "Design video ad creative for grounding sheets",
          description: "Create engaging video content that demonstrates the benefits of grounding sheets for better sleep. Include testimonials and scientific backing.",
          status: "todo" as Task["status"],
          priority: "medium" as Task["priority"],
          assignee: "You",
          dueDate: "2025-01-15",
          createdAt: "2025-01-08",
          category: "Creative",
        }
      ]
    } else if (currentProjectId === "2") {
      // Brand X Product Launch tasks
      return [
        {
          id: "3",
          title: "Market research for professional wellness products",
          description: "Analyze competitor landscape and identify positioning opportunities for our professional wellness line.",
          status: "completed" as Task["status"],
          priority: "high" as Task["priority"],
          assignee: "You",
          dueDate: "2025-01-05",
          createdAt: "2025-01-01",
          category: "Research",
        },
        {
          id: "4",
          title: "Develop brand messaging for urban professionals",
          description: "Create compelling brand narrative that resonates with busy professionals seeking work-life balance.",
          status: "in-progress" as Task["status"],
          priority: "medium" as Task["priority"],
          assignee: "You",
          dueDate: "2025-01-20",
          createdAt: "2025-01-10",
          category: "Strategy",
        }
      ]
    }
    return [] // Default empty for other projects
  }

  const [tasks, setTasks] = useState<Task[]>(getTasksForCurrentProject())
  
  // Add effect to update tasks when project changes
  useEffect(() => {
    setTasks(getTasksForCurrentProject())
  }, [currentProjectId])



  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")

  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnStatus: Task["status"]) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== columnStatus) {
      handleStatusChange(draggedTask.id, columnStatus)
    }
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUpdateTask = (updatedTask: Task) => {
    if (updatedTask.id === NEW_TASK_ID) {
      // This is a new task being saved
      const newTaskWithId = { ...updatedTask, id: Date.now().toString() }
      setTasks([...tasks, newTaskWithId])
      setSelectedTask(null) // Close the brief after creation
    } else {
      // This is an existing task being updated
      setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      setSelectedTask(updatedTask) // Update selected task to reflect changes
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
    setSelectedTask(null)
  }

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus })
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterPriority !== "all" && task.priority !== filterPriority) return false
    return true
  })

  const kanbanColumns = [
    { id: "todo", title: "To Do", status: "todo" as const },
    { id: "in-progress", title: "In Progress", status: "in-progress" as const },
    { id: "completed", title: "Completed", status: "completed" as const },
  ]

  const handleNewTaskClick = () => {
    setSelectedTask({
      id: NEW_TASK_ID, // Temporary ID for new task
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignee: "You",
      dueDate: "",
      createdAt: new Date().toISOString().split("T")[0],
      category: "General",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with New Task button and Filters */}
      <div className="flex items-center justify-between">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* New Task Button */}
        <Button onClick={handleNewTaskClick} className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Removed Create Task Form - now handled by TaskBriefPage */}

      {/* Tabs for different views */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={(checked) => {
                          handleStatusChange(task.id, checked ? "completed" : "todo")
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div
                          className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </div>
                        <div
                          className={`text-sm text-muted-foreground ${task.status === "completed" ? "line-through" : ""}`}
                        >
                          {task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                className={`space-y-4 min-h-[400px] p-4 rounded-lg transition-colors ${
                  dragOverColumn === column.status ? "bg-muted/50 border-2 border-dashed border-primary" : "bg-muted/10"
                }`}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {filteredTasks.filter((task) => task.status === column.status).length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredTasks
                    .filter((task) => task.status === column.status)
                    .map((task) => (
                      <Card
                        key={task.id}
                        className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                          draggedTask?.id === task.id ? "opacity-50 rotate-2 scale-105" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{task.assignee}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{task.dueDate}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs w-fit">
                              {task.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Brief Page (Full-screen overlay) */}
      {selectedTask && (
        <TaskBriefPage
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          NEW_TASK_ID={NEW_TASK_ID} // Pass the constant
        />
      )}
    </div>
  )
}