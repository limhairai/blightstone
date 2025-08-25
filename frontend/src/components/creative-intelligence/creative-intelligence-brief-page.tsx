"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { ensurePortalStyles } from "@/lib/portal-styles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MediaUpload } from "@/components/ui/media-upload"
import {
  X,
  Edit,
  Brain,
  Image,
  Video,
  FileText,
  Target,
  Lightbulb,
  Zap,
  Upload,
  List,
  LinkIcon,
  BarChart,
  Search,
  Settings,
  ExternalLink
} from "lucide-react"

// Import the CreativeIntelligence interface from the store
import { CreativeIntelligence, useProjectStore } from "@/lib/stores/project-store"
import { useAuth } from "@/contexts/AuthContext"

interface CreativeIntelligenceBriefPageProps {
  creative: CreativeIntelligence
  onClose: () => void
  onUpdateCreative: (creative: CreativeIntelligence) => void
  isNewCreative: boolean
}

export default function CreativeIntelligenceBriefPage({ creative, onClose, onUpdateCreative, isNewCreative }: CreativeIntelligenceBriefPageProps) {
  const [mounted, setMounted] = useState(false)
  const [isEditMode, setIsEditMode] = useState(isNewCreative)
  const [editingCreative, setEditingCreative] = useState<CreativeIntelligence | null>(null)
  const [activeSection, setActiveSection] = useState("overview") // For left navigation
  
  // Get project and auth context for media uploads
  const { currentProjectId } = useProjectStore()
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
    ensurePortalStyles()
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (creative) {
      setEditingCreative(creative)
      setIsEditMode(isNewCreative)
    }
  }, [creative, isNewCreative])

  if (!creative || !mounted) {
    return null
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    if (isNewCreative) {
      onClose()
    } else {
      setEditingCreative(creative)
      setIsEditMode(false)
    }
  }

  const handleSave = () => {
    if (editingCreative) {
      // Validate required fields
      if (!editingCreative.title?.trim()) {
        toast.error("Creative title is required")
        return
      }

      onUpdateCreative(editingCreative)
      setIsEditMode(false)
      toast.success(isNewCreative ? "Creative created successfully" : "Creative updated successfully")
    }
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: List },
    { id: "content", label: "Content & Assets", icon: Target },
    { id: "intelligence", label: "Creative Intelligence", icon: Brain },
    { id: "strategy", label: "Strategy & Analysis", icon: Lightbulb },
  ]

  const renderField = (label: string, value: string | undefined, field: keyof CreativeIntelligence, placeholder?: string, isTextarea = false) => (
    <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      {isEditMode ? (
        isTextarea ? (
          <Textarea
            value={(editingCreative as any)?.[field] || ""}
            onChange={(e) => setEditingCreative({ ...editingCreative!, [field]: e.target.value })}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            rows={3}
            className="w-full"
          />
        ) : (
          <Input
            value={(editingCreative as any)?.[field] || ""}
            onChange={(e) => setEditingCreative({ ...editingCreative!, [field]: e.target.value })}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className="w-full"
          />
        )
      ) : (
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{value || `No ${label.toLowerCase()} specified.`}</p>
      )}
    </div>
  )

  const renderSelectField = (label: string, value: string | undefined, field: keyof CreativeIntelligence, options: Array<{value: string, label: string}>) => (
    <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      {isEditMode ? (
        <select
          value={(editingCreative as any)?.[field] || ""}
          onChange={(e) => setEditingCreative({ ...editingCreative!, [field]: e.target.value })}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <p className="text-foreground">{options.find(opt => opt.value === value)?.label || `No ${label.toLowerCase()} specified.`}</p>
      )}
    </div>
  )

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      hook_library: "bg-blue-100 text-blue-800",
      winning_angles: "bg-green-100 text-green-800", 
      concept_gold: "bg-yellow-100 text-yellow-800",
      script_templates: "bg-purple-100 text-purple-800",
      headline_formulas: "bg-pink-100 text-pink-800",
      visual_patterns: "bg-indigo-100 text-indigo-800"
    }
    return colors[category] || colors.concept_gold
  }

  const formatCategoryName = (category: string) => {
    if (!category) return 'Unknown Category'
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderField("Creative Title", creative.title, "title", "Enter creative title *")}
                {renderSelectField("Creative Type", creative.creativeType, "creativeType", [
                  { value: "image", label: "Image" },
                  { value: "video", label: "Video" },
                  { value: "carousel", label: "Carousel" }
                ])}
                {renderSelectField("Category", creative.creativeCategory, "creativeCategory", [
                  { value: "concept_gold", label: "Concept Gold" },
                  { value: "hook_library", label: "Hook Library" },
                  { value: "winning_angles", label: "Winning Angles" },
                  { value: "script_templates", label: "Script Templates" },
                  { value: "headline_formulas", label: "Headline Formulas" },
                  { value: "visual_patterns", label: "Visual Patterns" }
                ])}
              </div>
              <div className="space-y-4">
                {renderSelectField("Status", creative.status, "status", [
                  { value: "active", label: "Active" },
                  { value: "template", label: "Template" },
                  { value: "archived", label: "Archived" }
                ])}
                {renderField("Platform", "Facebook", "platform")}
                <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Category Badge</h3>
                  <Badge className={getCategoryBadgeColor(creative.creativeCategory)}>
                    {formatCategoryName(creative.creativeCategory)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )

      case "content":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderField("Headline", creative.headline, "headline")}
                {renderField("Hook (Opening Line)", creative.hook, "hook", "The opening hook that grabs attention")}
                {renderField("Call to Action", creative.callToAction, "callToAction")}
              </div>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Creative Image</h3>
                  {isEditMode ? (
                    <MediaUpload
                      value={editingCreative?.imageUrl || undefined}
                      onChange={(url) => setEditingCreative({ ...editingCreative!, imageUrl: url })}
                      accept="image/*"
                      maxSize={20}
                      placeholder="Upload image or paste URL"
                      projectId={currentProjectId || undefined}
                      category="creative-intelligence-images"
                      createdBy={user?.email || undefined}
                    />
                  ) : (
                    creative.imageUrl ? (
                      <div className="space-y-2">
                        <div className="relative group cursor-pointer" onClick={() => window.open(creative.imageUrl, '_blank')}>
                          <img
                            src={creative.imageUrl}
                            alt="Creative"
                            className="w-full max-h-48 object-cover rounded-lg transition-transform hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Badge variant="secondary" className="gap-1">
                              <Image className="h-3 w-3" />
                              Click to view full size
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Creative image attached</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No image specified.</p>
                    )
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Creative Video</h3>
                  {isEditMode ? (
                    <MediaUpload
                      value={editingCreative?.videoUrl || undefined}
                      onChange={(url) => setEditingCreative({ ...editingCreative!, videoUrl: url })}
                      accept="video/*"
                      maxSize={100}
                      placeholder="Upload video or paste URL"
                      projectId={currentProjectId || undefined}
                      category="creative-intelligence-videos"
                      createdBy={user?.email || undefined}
                    />
                  ) : (
                    creative.videoUrl ? (
                      <div className="space-y-2">
                        <div className="relative group">
                          <video
                            src={creative.videoUrl}
                            className="w-full max-h-48 object-cover rounded-lg cursor-pointer"
                            controls
                            muted
                            preload="metadata"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(creative.videoUrl, '_blank')}
                              className="gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Full Screen
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Creative video attached</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No video specified.</p>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {renderField("Primary Copy", creative.primaryCopy, "primaryCopy", "Main ad copy/text", true)}
            </div>
          </div>
        )

      case "intelligence":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderField("Core Concept", creative.concept, "concept", "What's the main idea/concept?", true)}
                {renderField("Psychological Angle", creative.angle, "angle", "Pain point, aspiration, fear, urgency, etc.")}
                {renderField("Hook Pattern", creative.hookPattern, "hookPattern", "Problem/solution, curiosity, social proof, etc.")}
              </div>
              <div className="space-y-4">
                {renderField("Visual Style", creative.visualStyle, "visualStyle", "Lifestyle, product demo, UGC, before/after, etc.")}
                {renderField("Target Emotion", creative.targetEmotion, "targetEmotion", "What emotion does this trigger?")}
                {renderField("Psychology Trigger", creative.psychologyTrigger, "psychologyTrigger", "What psychological principle does this use?")}
              </div>
            </div>
          </div>
        )

      case "strategy":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {renderField("Performance Notes", creative.performanceNotes, "performanceNotes", "Why did this work? Performance context.", true)}
                {renderField("Scalability Notes", creative.scalabilityNotes, "scalabilityNotes", "How can this concept be scaled/varied?", true)}
              </div>
              <div className="space-y-4">
                {renderField("Remix Potential", creative.remixPotential, "remixPotential", "How can this be combined with other concepts?", true)}
                {renderField("Template Variables", creative.templateVariables, "templateVariables", "What parts can be customized if this is a template?", true)}
              </div>
            </div>
          </div>
        )

      default:
        return <div>Section not found</div>
    }
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Creative Sections</h2>
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
            <span className="text-sm text-muted-foreground">Creative Intelligence</span>
            <span className="font-medium">{isNewCreative ? "New Creative" : creative.title}</span>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderSectionContent(activeSection)}
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center px-6 justify-end gap-3 bg-card">
          <p className="text-xs text-muted-foreground mr-auto">Creative Intelligence powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                {isNewCreative ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
                {isNewCreative ? "Create Creative" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(briefPageContent, document.body)
}