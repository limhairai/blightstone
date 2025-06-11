"use client";
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"

// Define a type for activity log entries
interface ActivityEntry {
  id: string; // Or number, depending on what your API returns for keys
  date: string;
  user: string;
  action: string;
  description: string;
}

export function AdminOrgActivityLog({ orgId, isSuperuser }: { orgId: string, isSuperuser: boolean }) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]) // Use specific type
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    fetch(`/api/v1/organizations/${orgId}/activity`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch activity log")
        return res.json()
      })
      .then(data => setActivity(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId, isSuperuser])

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading activity log...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">User</th>
              <th className="py-2 text-left">Action</th>
              <th className="py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((entry) => (
              <tr key={entry.id} className="border-b hover:bg-muted/50">
                <td className="py-2">{entry.date}</td>
                <td className="py-2">{entry.user}</td>
                <td className="py-2">{entry.action}</td>
                <td className="py-2">{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* TODO: Add filters/search for activity log */}
      </CardContent>
    </Card>
  )
} 