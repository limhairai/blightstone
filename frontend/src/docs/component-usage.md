# AdHub Component Usage Guide

This document provides guidelines for using components consistently across the AdHub application.

## Table of Contents

1. [Layout Components](#layout-components)
2. [UI Components](#ui-components)
3. [Form Components](#form-components)
4. [Data Display Components](#data-display-components)
5. [Admin Components](#admin-components)

## Layout Components

### AppLayout

The main layout component for client-facing pages.

\`\`\`tsx
import { AppLayout } from "@/components/layout/app-layout"

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard" subtitle="Overview of your account">
      {/* Page content */}
    </AppLayout>
  )
}
\`\`\`

### AdminLayout

The layout component for admin pages.

\`\`\`tsx
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Admin Dashboard" subtitle="Platform overview">
      {/* Admin page content */}
    </AdminLayout>
  )
}
\`\`\`

## UI Components

### Button

Use the Button component for all clickable actions.

\`\`\`tsx
import { Button } from "@/components/ui/button"

// Primary button (default)
<Button>Click Me</Button>

// Secondary button
<Button variant="secondary">Secondary Action</Button>

// Outline button
<Button variant="outline" className="border-[#2A2A2A] hover:bg-[#2A2A2A]">
  Outline Button
</Button>

// Ghost button
<Button variant="ghost">Ghost Button</Button>

// Primary button with brand colors
<Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">
  Brand Button
</Button>
\`\`\`

### Card

Use Card components to group related content.

\`\`\`tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

<Card className="bg-[#1A1A1A] border-[#2A2A2A]">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter className="border-t border-[#2A2A2A] pt-4">
    {/* Card footer */}
  </CardFooter>
</Card>
\`\`\`

### StatusBadge

Use StatusBadge for displaying status information.

\`\`\`tsx
import { StatusBadge } from "@/components/core/status-badge"

<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="suspended" />
<StatusBadge status="inactive" />
\`\`\`

## Form Components

### Input

\`\`\`tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input 
    id="name" 
    placeholder="Enter your name" 
    className="bg-[#0A0A0A] border-[#2A2A2A]" 
  />
</div>
\`\`\`

## Data Display Components

### DataTable

\`\`\`tsx
import { DataTable } from "@/components/core/data-table"

const columns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

<DataTable columns={columns} data={data} />
\`\`\`

## Admin Components

### AdminRequestsTable

\`\`\`tsx
import { AdminRequestsTable } from "@/components/admin/admin-requests-table"

<AdminRequestsTable requests={requests} />
\`\`\`

### AdminClientsList

\`\`\`tsx
import { AdminClientsList } from "@/components/admin/admin-clients-list"

<AdminClientsList clients={clients} />

**Status Components**

Used to display various statuses (e.g., active, pending, error).

*   `StatusDot`
*   `StatusBadge`

```tsx
import { StatusDot } from "@/components/core/status-dot"
import { StatusBadge } from "@/components/core/status-badge"

<StatusDot status="active" />
<StatusBadge status="pending" size="sm">Pending Review</StatusBadge>
```

**Data Table**

```tsx
import { DataTable } from "@/components/core/data-table"

const columns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

<DataTable columns={columns} data={data} />
```