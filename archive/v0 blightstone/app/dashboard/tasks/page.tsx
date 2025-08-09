"use client"

import TasksPage from "../../../tasks-page"
import AppShell from "../../../app-shell"

export default function TasksPageWithShell() {
  return (
    <AppShell>
      <TasksPage />
    </AppShell>
  )
}
