import { useAdAccounts } from "../../contexts/AppDataContext"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

export function AdminOrgAccountsTable({ _orgId, isSuperuser }: { _orgId: string, isSuperuser: boolean }) {
  const { adAccounts, loading, error } = useAdAccounts();

  if (!isSuperuser) return <div className="p-4 text-center text-red-500">Not authorized</div>
  if (loading) return <div className="p-4 text-center">Loading ad accounts...</div>
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>

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
                        ? "bg-green-100 text-green-800 border-green-200"
                        : acc.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
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