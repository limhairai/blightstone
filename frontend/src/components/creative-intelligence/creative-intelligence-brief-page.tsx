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
  Upload
} from "lucide-react"

// Import the CreativeIntelligence interface from the store
import { CreativeIntelligence } from "@/lib/stores/project-store"

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

  const renderField = (label: string, value: string | undefined, field: keyof CreativeIntelligence, placeholder?: string) => {
    if (isEditMode) {
      return (
        <Input
          value={(editingCreative as any)?.[field] || ""}
          onChange={(e) => setEditingCreative({ ...editingCreative!, [field]: e.target.value })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground whitespace-pre-wrap leading-relaxed">{value || `No ${label.toLowerCase()} specified.`}</p>
  }

  const renderTextareaField = (label: string, value: string | undefined, field: keyof CreativeIntelligence, placeholder?: string, rows: number = 3) => {
    if (isEditMode) {
      return (
        <Textarea
          value={(editingCreative as any)?.[field] || ""}
          onChange={(e) => setEditingCreative({ ...editingCreative!, [field]: e.target.value })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          rows={rows}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground whitespace-pre-wrap leading-relaxed">{value || `No ${label.toLowerCase()} specified.`}</p>
  }

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
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Creative Sections</h2>
        </div>
        
        <div className="space-y-1 flex-1">
          <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
            <Brain className="h-4 w-4 inline mr-2" />
            Creative Intelligence
          </div>
          <div className="px-2 py-1 text-sm text-muted-foreground">
            <Target className="h-4 w-4 inline mr-2" />
            Content & Assets
          </div>
          <div className="px-2 py-1 text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4 inline mr-2" />
            Strategic Analysis
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-border space-y-2">
          {isEditMode ? (
            <>
              <Button onClick={handleSave} className="w-full">
                {isNewCreative ? "Create Creative" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="w-full gap-2">
              <Edit className="h-4 w-4" />
              Edit Creative
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditMode ? (
                    <Input
                      value={editingCreative?.title || ""}
                      onChange={(e) => setEditingCreative({ ...editingCreative!, title: e.target.value })}
                      placeholder="Enter creative title *"
                      className="text-3xl font-bold border-none p-0 h-auto bg-transparent"
                    />
                  ) : (
                    creative.title || "Untitled Creative"
                  )}
                  {isEditMode && <span className="text-red-500 ml-1">*</span>}
                </h1>
                <Badge className={getCategoryBadgeColor(creative.creativeCategory)}>
                  {formatCategoryName(creative.creativeCategory)}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Basic Info Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Creative Type & Category</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Creative Type</label>
                    {isEditMode ? (
                      <select
                        value={editingCreative?.creativeType}
                        onChange={(e) => setEditingCreative({ ...editingCreative!, creativeType: e.target.value as CreativeIntelligence["creativeType"] })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="carousel">Carousel</option>
                      </select>
                    ) : (
                      <p className="text-foreground capitalize">{creative.creativeType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    {isEditMode ? (
                      <select
                        value={editingCreative?.creativeCategory}
                        onChange={(e) => setEditingCreative({ ...editingCreative!, creativeCategory: e.target.value as CreativeIntelligence["creativeCategory"] })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="concept_gold">Concept Gold</option>
                        <option value="hook_library">Hook Library</option>
                        <option value="winning_angles">Winning Angles</option>
                        <option value="script_templates">Script Templates</option>
                        <option value="headline_formulas">Headline Formulas</option>
                        <option value="visual_patterns">Visual Patterns</option>
                      </select>
                    ) : (
                      <Badge className={getCategoryBadgeColor(creative.creativeCategory)}>
                        {formatCategoryName(creative.creativeCategory)}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    {isEditMode ? (
                      <select
                        value={editingCreative?.status}
                        onChange={(e) => setEditingCreative({ ...editingCreative!, status: e.target.value as CreativeIntelligence["status"] })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="active">Active</option>
                        <option value="template">Template</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <p className="text-foreground capitalize">{creative.status}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Creative Assets</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL</label>
                    {renderField("Image URL", creative.imageUrl, "imageUrl", "Upload or paste image URL")}
                    {isEditMode && (
                      <Button variant="outline" size="sm" className="mt-2 gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Video URL</label>
                    {renderField("Video URL", creative.videoUrl, "videoUrl", "Upload or paste video URL")}
                    {isEditMode && (
                      <Button variant="outline" size="sm" className="mt-2 gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Video
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Content */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Creative Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Headline</label>
                    {renderField("Headline", creative.headline, "headline")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hook (Opening Line)</label>
                    {renderField("Hook", creative.hook, "hook", "The opening hook that grabs attention")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Copy</label>
                    {renderTextareaField("Primary Copy", creative.primaryCopy, "primaryCopy", "Main ad copy/text", 4)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Call to Action</label>
                    {renderField("Call to Action", creative.callToAction, "callToAction")}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Creative Intelligence</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Core Concept</label>
                    {renderTextareaField("Core Concept", creative.concept, "concept", "What's the main idea/concept?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Psychological Angle</label>
                    {renderField("Angle", creative.angle, "angle", "Pain point, aspiration, fear, urgency, etc.")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hook Pattern</label>
                    {renderField("Hook Pattern", creative.hookPattern, "hookPattern", "Problem/solution, curiosity, social proof, etc.")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Visual Style</label>
                    {renderField("Visual Style", creative.visualStyle, "visualStyle", "Lifestyle, product demo, UGC, before/after, etc.")}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Analysis */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Psychology & Strategy</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Emotion</label>
                    {renderField("Target Emotion", creative.targetEmotion, "targetEmotion", "What emotion does this trigger?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Psychology Trigger</label>
                    {renderField("Psychology Trigger", creative.psychologyTrigger, "psychologyTrigger", "What psychological principle does this use?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Performance Notes</label>
                    {renderTextareaField("Performance Notes", creative.performanceNotes, "performanceNotes", "Why did this work? Performance context.")}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Scalability & Remixing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Scalability Notes</label>
                    {renderTextareaField("Scalability Notes", creative.scalabilityNotes, "scalabilityNotes", "How can this concept be scaled/varied?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Remix Potential</label>
                    {renderTextareaField("Remix Potential", creative.remixPotential, "remixPotential", "How can this be combined with other concepts?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Variables</label>
                    {renderTextareaField("Template Variables", creative.templateVariables, "templateVariables", "What parts can be customized if this is a template?")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(briefPageContent, document.body)
}