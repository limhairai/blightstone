"use client";
import { useEffect, useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminOrgFiles({ orgId, isSuperuser }: { orgId: string, isSuperuser: boolean }) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/files`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch files")
        return res.json()
      })
      .then(data => setFiles(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, isSuperuser])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)
    fetch(`/api/v1/organizations/${orgId}/files`, {
      method: "POST",
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to upload file")
        return res.json()
      })
      .then(() => {
        if (fileInputRef.current) fileInputRef.current.value = ""
        // Refetch files
        return fetch(`/api/v1/organizations/${orgId}/files`)
      })
      .then(res => res.json())
      .then(data => setFiles(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleDownload = (fileId: string) => {
    // Download file from backend
    fetch(`/api/v1/organizations/${orgId}/files/${fileId}/download`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to download file")
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = files.find(f => f.id === fileId)?.name || "file"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(err => setError(err.message))
  }

  const handleDelete = (fileId: string) => {
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/files/${fileId}`, {
      method: "DELETE",
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to delete file")
        return res.json()
      })
      .then(() => {
        // Refetch files
        return fetch(`/api/v1/organizations/${orgId}/files`)
      })
      .then(res => res.json())
      .then(data => setFiles(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading files...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="block"
          />
        </div>
        <div className="space-y-4">
          {files.length === 0 ? (
            <div className="text-xs text-muted-foreground">No files uploaded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">File Name</th>
                  <th className="py-2 text-left">Uploaded By</th>
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id} className="border-b hover:bg-muted/50">
                    <td className="py-2">{file.name}</td>
                    <td className="py-2">{file.uploadedBy}</td>
                    <td className="py-2">{file.date}</td>
                    <td className="py-2 text-right flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(file.id)}>Download</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(file.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 