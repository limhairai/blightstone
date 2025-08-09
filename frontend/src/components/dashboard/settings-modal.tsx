"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent } from "../ui/dialog"
import { cn } from "../../lib/utils"
import { Building2, Users, User, Settings } from "lucide-react"
import { OrganizationSettings } from "../settings/organization-settings"
import { TeamSettings } from "../settings/team-settings"
import { AccountSettings } from "../settings/account-settings"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSection?: string
}

interface SettingsSection {
  id: string
  name: string
  icon: any
  component: React.ComponentType
}

const settingsSections: SettingsSection[] = [
  {
    id: "organization",
    name: "Organization",
    icon: Building2,
    component: OrganizationSettings,
  },
  {
    id: "team",
    name: "Team",
    icon: Users,
    component: TeamSettings,
  },
  {
    id: "account",
    name: "Account",
    icon: User,
    component: AccountSettings,
  },
]

export function SettingsModal({ open, onOpenChange, defaultSection = "organization" }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState(defaultSection)

  const currentSection = settingsSections.find((section) => section.id === activeSection) || settingsSections[0]
  const CurrentComponent = currentSection.component

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[80vh] p-0 gap-0 bg-background border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          </div>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-border bg-card/50 overflow-y-auto">
            <div className="p-4 space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-[#F5F5F5]/50",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {section.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-6">
              <CurrentComponent />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
