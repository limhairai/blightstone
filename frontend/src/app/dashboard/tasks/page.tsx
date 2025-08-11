"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, User, Calendar, Filter, Edit3, Trash2 } from "lucide-react"
// Lazy load the brief page for better performance
const TaskBriefPage = React.lazy(() => import("@/components/tasks/task-brief-page"))

import { tasksApi } from "@/lib/api"

// Import interfaces from project store
import { Task, TaskAttachment, TaskLink } from "@/lib/stores/project-store"

// Define a constant for a new task's temporary ID
const NEW_TASK_ID = "new-task-temp-id"

export default function TasksPage() {
  
  // State for real data
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch all tasks for shared view
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedTasks = await tasksApi.getAll()
        setTasks(fetchedTasks)
      } catch (err) {
        setError('Failed to fetch tasks')
        console.error('Error fetching tasks:', err)
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchTasks()
  }, []) // No project dependency - load once
  
  // Production ready - using only real API data



  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [notesEditingTask, setNotesEditingTask] = useState<Task | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      if (updatedTask.id === NEW_TASK_ID) {
        // Creating a new task - remove the temporary ID
        const { id, ...taskData } = updatedTask
        const newTask = await tasksApi.create({
          ...taskData,
          projectId: '00000000-0000-0000-0000-000000000001' // Use shared project UUID
        })
        setTasks(prev => [...prev, newTask])
        setSelectedTask(null)
      } else {
        // Updating existing task
        const updated = await tasksApi.update(updatedTask.id, updatedTask)
        setTasks(prev => prev.map(task => task.id === updated.id ? updated : task))
        setSelectedTask(updated)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      // Show error to user instead of fallback
      alert('Failed to save task. Please try again.')
    }
  }



  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus })
    }
  }

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return
    
    setIsDeleting(true)
    try {
      await tasksApi.delete(taskToDelete.id)
      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id))
      if (selectedTask && selectedTask.id === taskToDelete.id) {
        setSelectedTask(null)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    } finally {
      setIsDeleting(false)
      setTaskToDelete(null)
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
      projectId: "00000000-0000-0000-0000-000000000001",
      notes: "",
      attachments: [],
      links: [],
    })
  }

  const handleNotesEdit = (task: Task) => {
    setNotesEditingTask(task)
    setTempNotes(task.notes || "")
  }

  const handleNotesSave = () => {
    if (notesEditingTask) {
      const updatedTasks = tasks.map(task => 
        task.id === notesEditingTask.id 
          ? { ...task, notes: tempNotes }
          : task
      )
      setTasks(updatedTasks)
      setNotesEditingTask(null)
      setTempNotes("")
    }
  }

  const handleNotesCancel = () => {
    setNotesEditingTask(null)
    setTempNotes("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
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
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="max-w-24 truncate text-sm text-muted-foreground">
                          {task.notes || "No notes"}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotesEdit(task)
                          }}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                                              onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(task)
                      }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {/* Notes Edit Dialog */}
      <Dialog open={!!notesEditingTask} onOpenChange={() => setNotesEditingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Task: <span className="font-medium">{notesEditingTask?.title}</span>
              </p>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleNotesCancel}>
              Cancel
            </Button>
            <Button onClick={handleNotesSave}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        itemName={taskToDelete?.title}
        onConfirm={handleDeleteTask}
        isLoading={isDeleting}
      />

      {/* Task Brief Page (Full-screen overlay) */}
      {selectedTask && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <TaskBriefPage
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={(taskId: string) => {
              const task = tasks.find(t => t.id === taskId)
              if (task) handleDeleteClick(task)
            }}
            NEW_TASK_ID={NEW_TASK_ID} // Pass the constant
          />
        </React.Suspense>
      )}
    </div>
  )
}