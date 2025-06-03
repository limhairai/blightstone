"use client";
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Define a type for note entries
interface NoteEntry {
  id: string; // Or number, depending on API response
  content: string;
}

export function AdminOrgNotes({ orgId, isSuperuser }: { orgId: string, isSuperuser: boolean }) {
  const [notes, setNotes] = useState<NoteEntry[]>([]) // Use specific type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/notes`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch notes")
        return res.json()
      })
      .then(data => setNotes(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, isSuperuser])

  const handleAddNote = () => {
    if (!newNote.trim()) return
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to add note")
        return res.json()
      })
      .then(() => {
        setNewNote("")
        // Refetch notes
        return fetch(`/api/v1/organizations/${orgId}/notes`)
      })
      .then(res => res.json())
      .then(data => setNotes(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading notes...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add new note..." />
          <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>Add</Button>
        </div>
        <ul>
          {notes.map((note: NoteEntry) => ( // Use specific type here
            <li key={note.id} className="py-2 border-b border-[#222]">{note.content}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
} 