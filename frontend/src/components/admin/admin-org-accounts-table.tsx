import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

export function AdminOrgAccountsTable({ _orgId, isSuperuser }: { _orgId: string, isSuperuser: boolean }) {
  const [adAccounts, setAdAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In real app, this would fetch from API
    const fetchAccounts = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data for now
        setAdAccounts([
          { id: '1', name: 'Demo Account 1', status: 'active' },
          { id: '2', name: 'Demo Account 2', status: 'pending' },
        ])
      } catch (err) {
        setError('Failed to load ad accounts')
      } finally {
        setLoading(false)
      }
    }

    if (isSuperuser) {
      fetchAccounts()
    }
  }, [isSuperuser])

  if (!isSuperuser) return <div className="p-4 text-center text-muted-foreground">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading ad accounts...</div>
  if (error) return <div className="p-4 text-center text-muted-foreground">{error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {adAccounts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No ad accounts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Account Name</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-right">Spend</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adAccounts.map((acc) => (
                <tr key={acc.id} className="border-b hover:bg-muted/50">
                  <td className="py-2">{acc.name}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={
                      acc.status === "active"
                        ? "bg-secondary text-foreground border-border"
                        : acc.status === "pending"
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }>{acc.status}</Badge>
                  </td>
                  <td className="py-2 text-right">$0</td>
                  <td className="py-2 text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline">Archive</Button>
                    <Button size="sm" variant="outline">Tag</Button>
                    <Button size="sm" variant="outline">Sync</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
} 