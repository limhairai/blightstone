"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { ensurePortalStyles } from "@/lib/portal-styles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
// Removed Select imports - using native HTML select elements
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { tasksApi, teamApi } from "@/lib/api"
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
  StickyNote,
  Upload,
  ExternalLink,
  Download,
  CheckSquare,
} from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"

// Import interfaces from project store
import { Task, TaskAttachment, TaskLink } from "@/lib/stores/project-store"

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
  const [mounted, setMounted] = useState(false)
  
  // Child tasks state
  const [childTasks, setChildTasks] = useState<Task[]>([])
  const [loadingChildTasks, setLoadingChildTasks] = useState(false)
  const [newChildTaskTitle, setNewChildTaskTitle] = useState("")
  const [creatingChildTask, setCreatingChildTask] = useState(false)

  // Team members state
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkFormData, setLinkFormData] = useState({ title: "", url: "" })

  const isNewTask = task?.id === NEW_TASK_ID

  useEffect(() => {
    setMounted(true)
    // Ensure portal styles are available for dropdowns
    ensurePortalStyles()
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (task) {
      setEditingTask(task)
      setIsEditMode(isNewTask) // If it's a new task, start in edit mode
      
      // Load child tasks if this is an existing task
      if (!isNewTask && task.id) {
        loadChildTasks(task.id)
      }
    }
  }, [task, isNewTask])

  // Load team members for assignee dropdown
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoadingTeamMembers(true)
      try {
        const members = await teamApi.getAll()
        setTeamMembers(members)
      } catch (error) {
        console.error('Error loading team members:', error)
        toast.error('Failed to load team members')
      } finally {
        setLoadingTeamMembers(false)
      }
    }

    fetchTeamMembers()
  }, [])

  const loadChildTasks = async (taskId: string) => {
    setLoadingChildTasks(true)
    try {
      // Load child tasks - no status filter to get all subtasks
      const children = await tasksApi.getChildren(taskId)
      setChildTasks(children)
    } catch (error) {
      console.error('Error loading child tasks:', error)
      toast.error('Failed to load subtasks')
    } finally {
      setLoadingChildTasks(false)
    }
  }

  if (!task || !mounted) {
    return null // Should not happen if opened correctly
  }

  const handleSave = () => {
    if (editingTask) {
      // Validate required fields
      if (!editingTask.title?.trim()) {
        toast.error("Task title is required. Please enter a title before saving.")
        return
      }

      // Additional validation for better UX
      if (editingTask.title.length > 255) {
        toast.error("Task title is too long. Please keep it under 255 characters.")
        return
      }

      // For new tasks, pass the task as-is (API will handle ID generation)
      // For existing tasks, pass the edited task
      onUpdateTask(editingTask)
      setIsEditMode(false)
      toast.success(isNewTask ? "Task created successfully" : "Task updated successfully")
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
      toast.success("Task deleted successfully")
    }
    onClose() // Close the brief after deletion or if it was a new task
  }

  const handleCreateChildTask = async () => {
    if (!newChildTaskTitle.trim() || !task.id || isNewTask) return
    
    setCreatingChildTask(true)
    try {
      const newChildTask = await tasksApi.createChild(task.id, {
        title: newChildTaskTitle.trim(),
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: 'You',
        category: task.category || 'General',
        projectId: task.projectId
      })
      
      setChildTasks(prev => [...prev, newChildTask])
      setNewChildTaskTitle('')
      toast.success('Subtask created successfully')
    } catch (error) {
      console.error('Error creating child task:', error)
      toast.error('Failed to create subtask')
    } finally {
      setCreatingChildTask(false)
    }
  }

  const handleAddLink = () => {
    setLinkFormData({ title: "", url: "" })
    setLinkDialogOpen(true)
  }

  const handleSaveLink = () => {
    if (!linkFormData.title.trim() || !linkFormData.url.trim() || !editingTask) {
      toast.error('Please fill in both title and URL')
      return
    }

    const newLink: TaskLink = {
      id: Date.now().toString(),
      title: linkFormData.title.trim(),
      url: linkFormData.url.trim(),
      description: "",
      addedAt: new Date().toISOString()
    }

    setEditingTask({
      ...editingTask,
      links: [...(editingTask.links || []), newLink]
    })

    setLinkDialogOpen(false)
    setLinkFormData({ title: "", url: "" })
    toast.success('Link added successfully!')
  }

  const handleChildTaskStatusChange = async (childTaskId: string, newStatus: Task["status"]) => {
    try {
      const childTask = childTasks.find(t => t.id === childTaskId)
      if (!childTask) return

      console.log('Updating child task:', childTaskId, 'to status:', newStatus)
      const updatedChildTask = await tasksApi.update(childTaskId, { ...childTask, status: newStatus })
      
      // If child task is marked as completed, remove it from the list (since completed tasks are hidden)
      if (newStatus === 'completed') {
        setChildTasks(prev => prev.filter(t => t.id !== childTaskId))
        toast.success('Subtask completed and archived')
      } else {
        setChildTasks(prev => prev.map(t => t.id === childTaskId ? updatedChildTask : t))
        toast.success('Subtask updated successfully')
      }
      
      // Reload child tasks to get updated counts for the parent task
      if (task.id) {
        loadChildTasks(task.id)
      }
    } catch (error) {
      console.error('Error updating child task:', error)
      toast.error('Failed to update subtask')
    }
  }

  const handleDeleteChildTask = async (childTaskId: string) => {
    try {
      console.log('Deleting child task:', childTaskId)
      await tasksApi.delete(childTaskId)
      setChildTasks(prev => prev.filter(t => t.id !== childTaskId))
      toast.success('Subtask deleted successfully')
      
      // Reload child tasks to get updated counts
      if (task.id) {
        loadChildTasks(task.id)
      }
    } catch (error) {
      console.error('Error deleting child task:', error)
      toast.error('Failed to delete subtask')
    }
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
    { id: "subtasks", label: "Subtasks", icon: CheckSquare },
    { id: "notes", label: "Notes", icon: StickyNote },
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
              <h2 className="text-lg font-semibold mb-3">Task Title <span className="text-red-500">*</span></h2>
              {isEditMode ? (
                <Input
                  value={editingTask?.title || ""}
                  onChange={(e) => setEditingTask({ ...editingTask!, title: e.target.value })}
                  className={`text-xl font-bold ${
                    !editingTask?.title?.trim() ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter task title (required)"
                  required
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
                    <select
                      value={editingTask?.assignee || ""}
                      onChange={(e) => setEditingTask({ ...editingTask!, assignee: e.target.value })}
                      className="w-48 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      disabled={loadingTeamMembers}
                    >
                      <option value="">Select assignee</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
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
                    <select
                      value={editingTask?.status}
                      onChange={(e) => setEditingTask({ ...editingTask!, status: e.target.value as Task["status"] })}
                      className="w-48 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select status</option>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status.replace("-", " ")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Priority</span>
                  {isEditMode ? (
                    <select
                      value={editingTask?.priority}
                      onChange={(e) => setEditingTask({ ...editingTask!, priority: e.target.value as Task["priority"] })}
                      className="w-48 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
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
                    <select
                      value={editingTask?.category}
                      onChange={(e) => setEditingTask({ ...editingTask!, category: e.target.value })}
                      className="w-48 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select category</option>
                      <option value="Product Page">Product Page</option>
                      <option value="Creatives">Creatives</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Research">Research</option>
                      <option value="General">General</option>
                    </select>
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
      case "subtasks":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Subtasks</h2>
              {!isNewTask && (
                <Badge variant="outline" className="text-xs">
                  {childTasks.filter(t => t.status === 'completed').length}/{childTasks.length} completed
                </Badge>
              )}
            </div>
            
            {/* Add New Subtask */}
            {!isNewTask && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newChildTaskTitle}
                  onChange={(e) => setNewChildTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateChildTask()}
                  disabled={creatingChildTask}
                />
                <Button
                  onClick={handleCreateChildTask}
                  disabled={!newChildTaskTitle.trim() || creatingChildTask}
                  size="sm"
                >
                  {creatingChildTask ? "Adding..." : "Add"}
                </Button>
              </div>
            )}
            
            {/* Child Tasks List */}
            {isNewTask ? (
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Save this task first to add subtasks
                </p>
              </div>
            ) : loadingChildTasks ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted/30 rounded-lg p-3 h-16" />
                ))}
              </div>
            ) : childTasks.length > 0 ? (
              <div className="space-y-2">
                {childTasks.map((childTask) => (
                  <div
                    key={childTask.id}
                    className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border hover:bg-muted/30 transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={childTask.status === 'completed'}
                      onChange={(e) => handleChildTaskStatusChange(
                        childTask.id, 
                        e.target.checked ? 'completed' : 'todo'
                      )}
                      className="w-4 h-4 rounded border border-input"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        childTask.status === 'completed' 
                          ? 'line-through text-muted-foreground' 
                          : 'text-foreground'
                      }`}>
                        {childTask.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(childTask.priority)} variant="secondary">
                          {childTask.priority}
                        </Badge>
                        <Badge className={getStatusColor(childTask.status)} variant="secondary">
                          {childTask.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChildTask(childTask.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      title="Delete subtask"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No subtasks yet. Add one above to break down this task.
                </p>
              </div>
            )}
          </div>
        )
      case "notes":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <h2 className="text-lg font-semibold">Quick Notes</h2>
            {isEditMode ? (
              <Textarea
                value={editingTask?.notes || ""}
                onChange={(e) => setEditingTask({ ...editingTask!, notes: e.target.value })}
                placeholder="Add quick notes about this task..."
                className="min-h-[120px] resize-none"
              />
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[120px]">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {task.notes || "No notes added."}
                </p>
              </div>
            )}
          </div>
        )
      case "attachments":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Attachments</h2>
            </div>
            
            {/* File Upload Component */}
            {isEditMode && (
              <FileUpload
                onUpload={(attachment) => {
                  if (editingTask) {
                    setEditingTask({
                      ...editingTask,
                      attachments: [...(editingTask.attachments || []), attachment]
                    })
                  }
                }}
                maxSizeMB={10}
                bucket="task-attachments"
              />
            )}
            
            {/* Existing Attachments */}
            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(1)} KB • {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(attachment.url, '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {isEditMode && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (editingTask) {
                              setEditingTask({
                                ...editingTask,
                                attachments: editingTask.attachments?.filter(a => a.id !== attachment.id)
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/30">
                <Paperclip className="h-8 w-8 mb-2" />
                <p className="text-center text-sm">
                  {isEditMode 
                    ? "No attachments yet. Use the upload area above to add files." 
                    : "No attachments yet."
                  }
                </p>
              </div>
            )}
          </div>
        )
      case "links":
        return (
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Links</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddLink}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>
            
            {/* Existing Links */}
            {task.links && task.links.length > 0 ? (
              <div className="space-y-2">
                {task.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div className="flex items-center gap-3 flex-1">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{link.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        {link.description && (
                          <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(link.url, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {isEditMode && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (editingTask) {
                              setEditingTask({
                                ...editingTask,
                                links: editingTask.links?.filter(l => l.id !== link.id)
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-muted-foreground/30">
                <LinkIcon className="h-8 w-8 mb-2" />
                <p className="text-center text-sm">No links added yet. Add relevant links to get started.</p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
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
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-[#F5F5F5]"
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

  // Render the brief page as a portal to document.body to ensure it's above everything
  // Wrap in a div with complete CSS variable inheritance for dropdowns
  return createPortal(
    <div 
      className="font-sans antialiased" 
      style={{ 
        '--background': '0 0% 100%',
        '--foreground': '0 0% 9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 9%',
        '--primary': '0 0% 9%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 0% 95%',
        '--secondary-foreground': '0 0% 9%',
        '--muted': '0 0% 96%',
        '--muted-foreground': '0 0% 45%',
        '--accent': '0 0% 96%',
        '--accent-foreground': '0 0% 9%',
        '--destructive': '0 0% 20%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '0 0% 90%',
        '--input': '0 0% 98%',
        '--ring': '0 0% 9%'
      } as React.CSSProperties}
    >
      {briefPageContent}
      
      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                placeholder="Enter link title"
                value={linkFormData.title}
                onChange={(e) => setLinkFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkFormData.url}
                onChange={(e) => setLinkFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLink}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>, 
    document.body
  )
}