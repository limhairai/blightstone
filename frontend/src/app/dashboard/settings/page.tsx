"use client"

import { OrganizationSettings } from "@/components/settings/organization-settings"
import { layout } from "@/lib/layout-utils"

export default function SettingsPage() {
  return (
    <div className={layout.pageContent}>
      <OrganizationSettings />
    </div>
  )
} 