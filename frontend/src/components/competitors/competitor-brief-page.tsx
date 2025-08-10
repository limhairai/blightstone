"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { ensurePortalStyles } from "@/lib/portal-styles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { X, Edit, List, Search, ChevronRight, Settings, Trash2, LinkIcon, BarChart, ExternalLink } from "lucide-react"

// Import the Competitor interface from the store
import { Competitor } from "@/lib/stores/project-store"

// Define the interface for the brief page (different from store)
interface CompetitorBrief {
  id: string
  name: string
  website: string
  adLibraryLink: string
  market: string
  offerUrl: string
  trafficVolume: string
  level: "poor" | "medium" | "high"
  projectId: string
  notes?: string
}

interface CompetitorBriefPageProps {
  competitor: CompetitorBrief | null
  onClose: () => void
  onUpdateCompetitor: (updatedCompetitor: CompetitorBrief) => void
  onDeleteCompetitor: (competitorId: string) => void
  NEW_COMPETITOR_ID: string // Constant for new competitor temp ID
}

export default function CompetitorBriefPage({
  competitor,
  onClose,
  onUpdateCompetitor,
  onDeleteCompetitor,
  NEW_COMPETITOR_ID,
}: CompetitorBriefPageProps) {
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorBrief | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("overview") // For left navigation
  const [mounted, setMounted] = useState(false)

  const isNewCompetitor = competitor?.id === NEW_COMPETITOR_ID

  useEffect(() => {
    setMounted(true)
    // Ensure portal styles are available for dropdowns
    ensurePortalStyles()
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (competitor) {
      setEditingCompetitor(competitor)
      setIsEditMode(isNewCompetitor) // If it's a new competitor, start in edit mode
    }
  }, [competitor, isNewCompetitor])

  if (!competitor || !mounted) {
    return null // Should not happen if opened correctly
  }

  const handleSave = () => {
    if (editingCompetitor) {
      // Validate required fields
      if (!editingCompetitor.name?.trim()) {
        toast.error("Competitor name is required")
        return
      }

      // For new competitors, pass the competitor as-is (API will handle ID generation)
      // For existing competitors, pass the edited competitor
      onUpdateCompetitor(editingCompetitor)
      toast.success(isNewCompetitor ? "Competitor created successfully" : "Competitor updated successfully")
      onClose() // Close the brief after saving
    }
  }

  const handleDiscard = () => {
    if (isNewCompetitor) {
      onClose() // If new competitor, just close without saving
    } else {
      setEditingCompetitor(competitor) // Revert to original competitor data
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewCompetitor && competitor.id) {
      onDeleteCompetitor(competitor.id)
    }
    onClose() // Close the brief after deletion or if it was a new competitor
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: List },
    { id: "links", label: "Links", icon: LinkIcon },
    { id: "performance", label: "Performance", icon: BarChart },
  ]

  const renderSectionContent = (sectionId: string) => {
    const renderField = (label: string, value: string, fieldName: keyof CompetitorBrief, isInput = true) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          <Input
            value={(editingCompetitor?.[fieldName] as string) || ""}
            onChange={(e) => setEditingCompetitor({ ...editingCompetitor!, [fieldName]: e.target.value })}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {value || `No ${label.toLowerCase()} provided.`}
          </p>
        )}
      </div>
    )

    const renderLinkField = (label: string, value: string, fieldName: keyof CompetitorBrief) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          <Input
            type="url"
            value={(editingCompetitor?.[fieldName] as string) || ""}
            onChange={(e) => setEditingCompetitor({ ...editingCompetitor!, [fieldName]: e.target.value })}
            placeholder={`Enter ${label.toLowerCase()} URL`}
          />
        ) : (
          <div className="flex items-center">
            {value ? (
              <Button variant="link" size="sm" asChild className="p-0 h-auto">
                <a href={value} target="_blank" rel="noopener noreferrer">
                  {value} <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            ) : (
              <span className="text-muted-foreground">No link provided.</span>
            )}
          </div>
        )}
      </div>
    )

    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Competitor Name */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Competitor Name <span className="text-red-500">*</span></h2>
              {isEditMode ? (
                <Input
                  value={editingCompetitor?.name || ""}
                  onChange={(e) => setEditingCompetitor({ ...editingCompetitor!, name: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="Enter competitor name"
                />
              ) : (
                <h3 className="text-xl font-bold">{competitor.name || "Untitled Competitor"}</h3>
              )}
            </div>

            {/* Market */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Market</h2>
              {isEditMode ? (
                <Input
                  value={editingCompetitor?.market || ""}
                  onChange={(e) => setEditingCompetitor({ ...editingCompetitor!, market: e.target.value })}
                  placeholder="e.g., USA, Global"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {competitor.market || "No market specified."}
                </p>
              )}
            </div>
          </div>
        )
      case "links":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Website URL</h2>
              {renderLinkField("Website URL", competitor.website, "website")}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Ad Library Link</h2>
              {renderLinkField("Ad Library Link", competitor.adLibraryLink, "adLibraryLink")}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Offer URL (Main Product Page)</h2>
              {renderLinkField("Offer URL", competitor.offerUrl, "offerUrl")}
            </div>
          </div>
        )
      case "performance":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Traffic Volume (Monthly Visitors)</h2>
              {renderField("Traffic Volume", competitor.trafficVolume, "trafficVolume")}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Level (Proficiency Judgement)</h2>
              {isEditMode ? (
                <Select
                  value={editingCompetitor?.level}
                  onValueChange={(value) =>
                    setEditingCompetitor({ ...editingCompetitor!, level: value as Competitor["level"] })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {competitor.level ? competitor.level.charAt(0).toUpperCase() + competitor.level.slice(1) : "No level specified."}
                </p>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Competitor Sections</h2>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sections..." className="pl-9" />
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-10 ${
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-[#F5F5F5]"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </nav>
        <Separator className="my-4" />
        <Button variant="ghost" className="w-full justify-start h-10 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-6 justify-between bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Competitor Tracker</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {isNewCompetitor ? "New Competitor" : competitor.name || "Untitled Competitor"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isNewCompetitor && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? "bg-accent text-accent-foreground" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full ml-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{renderSectionContent(activeSection)}</div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center px-6 justify-end gap-3 bg-card">
          <p className="text-xs text-muted-foreground mr-auto">Competitor tracking powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleDiscard}>
                {isNewCompetitor ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-accent hover:bg-[#F5F5F5]/90 text-accent-foreground">
                {isNewCompetitor ? "Create Competitor" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // Render the brief page as a portal to document.body to ensure it's above everything
  // Wrap in a div with complete CSS variable inheritance for dropdowns
  return createPortal(
    <div 
      className="font-sans antialiased" 
      style={{ 
        '--background': '0 0% 100%',
        '--foreground': '0 0% 9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 9%',
        '--primary': '0 0% 9%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 0% 95%',
        '--secondary-foreground': '0 0% 9%',
        '--muted': '0 0% 96%',
        '--muted-foreground': '0 0% 45%',
        '--accent': '0 0% 96%',
        '--accent-foreground': '0 0% 9%',
        '--destructive': '0 0% 20%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '0 0% 90%',
        '--input': '0 0% 98%',
        '--ring': '0 0% 9%'
      } as React.CSSProperties}
    >
      {briefPageContent}
    </div>, 
    document.body
  )
}