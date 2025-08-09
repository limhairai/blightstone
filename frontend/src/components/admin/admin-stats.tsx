"use client";
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"

export function AdminStats({ isSuperuser }: { isSuperuser: boolean }) {
  const [stats, setStats] = useState<Record<string, string | number | boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isSuperuser) return;
    setLoading(true)
    setError("")
    const token = typeof window !== 'undefined' ? localStorage.getItem('blightstone_token') : null;
    fetch("/api/v1/admin/stats", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stats")
        return res.json()
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [isSuperuser])

  if (!isSuperuser) return <div className="p-4 text-center text-muted-foreground">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading stats...</div>
  if (error) return <div className="p-4 text-center text-muted-foreground">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <ul className="space-y-2">
            {Object.entries(stats).map(([key, value]) => (
              <li key={key} className="flex justify-between border-b border-[#222] py-2">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-bold">{value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">No stats available.</div>
        )}
      </CardContent>
    </Card>
  )
} 