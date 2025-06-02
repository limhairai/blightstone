import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { UsageCircle } from "@/components/accounts/usage-circle"

export function ProjectsTab() {
  // Mock data - in a real app, this would come from an API
  const projects = [
    {
      id: 1,
      name: "Marketing Campaigns",
      accounts: 10,
      status: "Approved",
      bmId: "123456789",
      landingPage: "https://example.com/landing1",
      facebookPage: "https://facebook.com/example",
      dateCreated: "04/10/2025",
      usage: { used: 58, total: 100 },
    },
    {
      id: 2,
      name: "Social Media",
      accounts: 5,
      status: "Approved",
      bmId: "987654321",
      landingPage: "https://example.com/landing2",
      facebookPage: "https://facebook.com/example2",
      dateCreated: "04/15/2025",
      usage: { used: 120, total: 100 },
    },
    {
      id: 3,
      name: "New Campaign",
      accounts: 0,
      status: "Pending",
      bmId: "456789123",
      landingPage: "https://example.com/landing3",
      facebookPage: "https://facebook.com/example3",
      dateCreated: "04/18/2025",
      usage: { used: 0, total: 100 },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input placeholder="Search projects..." className="pl-10" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <PlusIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">Get started by creating your first project.</p>
          <Button>Create Project</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead># Accounts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Business Manager ID</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.accounts}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        project.status === "Approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {project.status}
                    </div>
                  </TableCell>
                  <TableCell>{project.bmId}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">{project.landingPage}</div>
                  </TableCell>
                  <TableCell>{project.dateCreated}</TableCell>
                  <TableCell>
                    <UsageCircle percentage={project.usage.used} />
                  </TableCell>
                  <TableCell>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
