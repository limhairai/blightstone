"use client";
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Pencil, Trash2, Check, X } from "lucide-react"

// Define a type for task entries
interface TaskEntry {
  id: string; // Or number, depending on API response
  title: string;
  assignee?: string;
  due?: string;
  status: "pending" | "completed" | string; // Allow other statuses if any
}

export function AdminOrgTasks({ orgId, isSuperuser }: { orgId: string, isSuperuser: boolean }) {
  const [tasks, setTasks] = useState<TaskEntry[]>([]) // Use specific type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTask, setNewTask] = useState("")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/tasks`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch tasks")
        return res.json()
      })
      .then(data => setTasks(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, isSuperuser])

  const handleAddTask = () => {
    if (!newTask.trim()) return
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to add task")
        return res.json()
      })
      .then(() => {
        setNewTask("")
        // Refetch tasks
        return fetch(`/api/v1/organizations/${orgId}/tasks`)
      })
      .then(res => res.json())
      .then(data => setTasks(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleMarkComplete = (id: string) => {
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to mark task complete")
        return res.json()
      })
      .then(() => {
        // Refetch tasks
        return fetch(`/api/v1/organizations/${orgId}/tasks`)
      })
      .then(res => res.json())
      .then(data => setTasks(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleEditTask = (task: TaskEntry) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const handleSaveEdit = (id: string) => {
    if (!editingTitle.trim()) return
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingTitle }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update task")
        return res.json()
      })
      .then(() => {
        setEditingTaskId(null)
        setEditingTitle("")
        // Refetch tasks
        return fetch(`/api/v1/organizations/${orgId}/tasks`)
      })
      .then(res => res.json())
      .then(data => setTasks(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditingTitle("")
  }

  const handleDeleteTask = (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/tasks/${id}`, {
      method: "DELETE",
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to delete task")
        // Refetch tasks
        return fetch(`/api/v1/organizations/${orgId}/tasks`)
      })
      .then(res => res.json())
      .then(data => setTasks(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading tasks...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Add a task..."
            className="flex-1"
          />
          <Button onClick={handleAddTask} disabled={!newTask.trim()}>Add</Button>
        </div>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-xs text-muted-foreground">No tasks yet.</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="border rounded p-2 bg-muted/50 flex items-center justify-between">
                <div className="flex-1">
                  {editingTaskId === task.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        className="flex-1"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(task.id)
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => handleSaveEdit(task.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">Assignee: {task.assignee} • Due: {task.due}</div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className={task.status === "completed" ? "text-[#34D197] text-xs" : "text-yellow-600 text-xs"}>{task.status}</span>
                  {editingTaskId !== task.id && (
                    <>
                      {task.status !== "completed" && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkComplete(task.id)}>Mark Complete</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEditTask(task)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 