"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Edit,
  User,
  Calendar,
  LinkIcon,
  Paperclip,
  FileText,
  List,
  Tag,
  Clock,
  Search,
  ChevronRight,
  Settings,
  Trash2,
} from "lucide-react"

// Re-using the Task interface from tasks-page.tsx
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

interface TaskBriefPageProps {
  task: Task | null
  onClose: () => void
  onUpdateTask: (updatedTask: Task) => void
  onDeleteTask: (taskId: string) => void
  NEW_TASK_ID: string // Receive the constant
}

export default function TaskBriefPage({ task, onClose, onUpdateTask, onDeleteTask, NEW_TASK_ID }: TaskBriefPageProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("overview") // For left navigation

  const isNewTask = task?.id === NEW_TASK_ID

  useEffect(() => {
    if (task) {
      setEditingTask(task)
      setIsEditMode(isNewTask) // If it's a new task, start in edit mode
    }
  }, [task, isNewTask])

  if (!task) {
    return null // Should not happen if opened correctly
  }

  const handleSave = () => {
    if (editingTask) {
      // If it's a new task, generate a real ID before saving
      const taskToSave = isNewTask ? { ...editingTask, id: Date.now().toString() } : editingTask
      onUpdateTask(taskToSave)
      setIsEditMode(false)
    }
  }

  const handleDiscard = () => {
    if (isNewTask) {
      onClose() // If new task, just close without saving
    } else {
      setEditingTask(task) // Revert to original task data
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewTask && task.id) {
      // Only allow deleting existing tasks
      onDeleteTask(task.id)
    }
    onClose() // Close the brief after deletion or if it was a new task
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

  const navItems = [
    { id: "overview", label: "Overview", icon: List },
    { id: "description", label: "Description", icon: FileText },
    { id: "attachments", label: "Attachments", icon: Paperclip },
    { id: "links", label: "Links", icon: LinkIcon },
  ]

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Task Title Section */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Task Title</h2>
              {isEditMode ? (
                <Input
                  value={editingTask?.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask!, title: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Enter task title"
                />
              ) : (
                <h3 className="text-xl font-bold">{task.title || "No Title"}</h3>
              )}
            </div>
            {/* Task Properties Section */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Task Properties</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Assignee</span>
                  </div>
                  {isEditMode ? (
                    <Input
                      value={editingTask?.assignee || ""}
                      onChange={(e) => setEditingTask({ ...editingTask!, assignee: e.target.value })}
                      className="w-48"
                      placeholder="Assignee"
                    />
                  ) : (
                    <span className="text-muted-foreground">{task.assignee || "Unassigned"}</span>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Due Date</span>
                  </div>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editingTask?.dueDate || ""}
                      onChange={(e) => setEditingTask({ ...editingTask!, dueDate: e.target.value })}
                      className="w-48"
                    />
                  ) : (
                    <span className="text-muted-foreground">{task.dueDate || "No due date"}</span>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Status</span>
                  {isEditMode ? (
                    <Select
                      value={editingTask?.status}
                      onValueChange={(value) => setEditingTask({ ...editingTask!, status: value as Task["status"] })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status.replace("-", " ")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Priority</span>
                  {isEditMode ? (
                    <Select
                      value={editingTask?.priority}
                      onValueChange={(value) =>
                        setEditingTask({ ...editingTask!, priority: value as Task["priority"] })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Category</span>
                  </div>
                  {isEditMode ? (
                    <Select
                      value={editingTask?.category}
                      onValueChange={(value) => setEditingTask({ ...editingTask!, category: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Research">Research</SelectItem>
                        <SelectItem value="Creative">Creative</SelectItem>
                        <SelectItem value="Content">Content</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{task.category || "No Category"}</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Created</span>
                  </div>
                  <span className="text-muted-foreground">{task.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        )
      case "description":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <h2 className="text-lg font-semibold">Description</h2>
            {isEditMode ? (
              <Textarea
                value={editingTask?.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask!, description: e.target.value })}
                rows={15}
                className="resize-y"
                placeholder="Write your task brief here, just like a document."
              />
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[100px]">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {task.description || "No description provided."}
                </p>
              </div>
            )}
          </div>
        )
      case "attachments":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <h2 className="text-lg font-semibold">Attachments</h2>
            <div className="bg-muted/30 rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/30">
              <Paperclip className="h-8 w-8 mb-2" />
              <p className="text-center text-sm">Drag and drop files here, or click to upload.</p>
              <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                Upload File
              </Button>
            </div>
          </div>
        )
      case "links":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <h2 className="text-lg font-semibold">Links</h2>
            <div className="bg-muted/30 rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/30">
              <LinkIcon className="h-8 w-8 mb-2" />
              <p className="text-center text-sm">Add relevant links here.</p>
              <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                Add Link
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Task Sections</h2>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sections..." className="pl-9" />
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-10 ${
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </nav>
        <Separator className="my-4" />
        <Button variant="ghost" className="w-full justify-start h-10 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-6 justify-between bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Tasks</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{isNewTask ? "New Task" : task.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isNewTask && ( // Only show delete button for existing tasks
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? "bg-accent text-accent-foreground" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full ml-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{renderSectionContent(activeSection)}</div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center px-6 justify-end gap-3 bg-card">
          <p className="text-xs text-muted-foreground mr-auto">Task management powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleDiscard}>
                {isNewTask ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
                {isNewTask ? "Create Task" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}