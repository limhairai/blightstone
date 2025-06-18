"use client"

import { OrganizationSettings } from "../../../components/settings/organization-settings"
import { layout } from "../../../lib/layout-utils"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <div className={layout.pageContent}>
      <OrganizationSettings />
    </div>
  )
} 