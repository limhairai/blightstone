"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { ensurePortalStyles } from "@/lib/portal-styles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
// Using native HTML select elements for dropdowns
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Edit,
  TrendingUp,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  Users,
  Calendar,
  ExternalLink,
  FileText,
  Lightbulb,
  BarChart3,
  Zap
} from "lucide-react"

// Import the TopAd interface from the store
import { TopAd } from "@/lib/stores/project-store"

interface TopAdBriefPageProps {
  topAd: TopAd
  onClose: () => void
  onUpdateTopAd: (topAd: TopAd) => void
  isNewTopAd: boolean
}

export default function TopAdBriefPage({ topAd, onClose, onUpdateTopAd, isNewTopAd }: TopAdBriefPageProps) {
  const [mounted, setMounted] = useState(false)
  const [isEditMode, setIsEditMode] = useState(isNewTopAd)
  const [editingTopAd, setEditingTopAd] = useState<TopAd | null>(null)

  useEffect(() => {
    setMounted(true)
    // Ensure portal styles are available for dropdowns
    ensurePortalStyles()
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (topAd) {
      setEditingTopAd(topAd)
      setIsEditMode(isNewTopAd) // If it's a new top ad, start in edit mode
    }
  }, [topAd, isNewTopAd])

  if (!topAd || !mounted) {
    return null // Should not happen if opened correctly
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    if (isNewTopAd) {
      onClose() // Close if it's a new top ad and user cancels
    } else {
      setEditingTopAd(topAd) // Revert to original top ad data
      setIsEditMode(false)
    }
  }

  const handleSave = () => {
    if (editingTopAd) {
      // Validate required fields
      if (!editingTopAd.adTitle?.trim()) {
        toast.error("Ad title is required")
        return
      }
      if (!editingTopAd.platform?.trim()) {
        toast.error("Platform is required")
        return
      }

      // For new top ads, pass the top ad as-is (API will handle ID generation)
      // For existing top ads, pass the edited top ad
      onUpdateTopAd(editingTopAd)
      setIsEditMode(false)
      toast.success(isNewTopAd ? "Top ad created successfully" : "Top ad updated successfully")
    }
  }

  const renderField = (label: string, value: string | undefined, field: keyof TopAd, placeholder?: string) => {
    if (isEditMode) {
      return (
        <Input
          value={(editingTopAd as any)?.[field] || ""}
          onChange={(e) => setEditingTopAd({ ...editingTopAd!, [field]: e.target.value })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground whitespace-pre-wrap leading-relaxed">{value || `No ${label.toLowerCase()} specified.`}</p>
  }

  const renderTextareaField = (label: string, value: string | undefined, field: keyof TopAd, placeholder?: string, rows: number = 3) => {
    if (isEditMode) {
      return (
        <Textarea
          value={(editingTopAd as any)?.[field] || ""}
          onChange={(e) => setEditingTopAd({ ...editingTopAd!, [field]: e.target.value })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          rows={rows}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground whitespace-pre-wrap leading-relaxed">{value || `No ${label.toLowerCase()} specified.`}</p>
  }

  const renderNumberField = (label: string, value: number | undefined, field: keyof TopAd, placeholder?: string, step?: string) => {
    if (isEditMode) {
      return (
        <Input
          type="number"
          step={step || "0.01"}
          value={(editingTopAd as any)?.[field] || ""}
          onChange={(e) => setEditingTopAd({ ...editingTopAd!, [field]: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground">{value !== undefined ? value.toLocaleString() : `No ${label.toLowerCase()} specified.`}</p>
  }

  const renderCurrencyField = (label: string, value: number | undefined, field: keyof TopAd, placeholder?: string) => {
    if (isEditMode) {
      return (
        <Input
          type="number"
          step="0.01"
          value={(editingTopAd as any)?.[field] || ""}
          onChange={(e) => setEditingTopAd({ ...editingTopAd!, [field]: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground">{value !== undefined ? `$${value.toLocaleString()}` : `No ${label.toLowerCase()} specified.`}</p>
  }

  const renderPercentageField = (label: string, value: number | undefined, field: keyof TopAd, placeholder?: string) => {
    if (isEditMode) {
      return (
        <Input
          type="number"
          step="0.01"
          value={(editingTopAd as any)?.[field] || ""}
          onChange={(e) => setEditingTopAd({ ...editingTopAd!, [field]: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full"
        />
      )
    }
    return <p className="text-foreground">{value !== undefined ? `${value.toFixed(2)}%` : `No ${label.toLowerCase()} specified.`}</p>
  }

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: "bg-blue-100 text-blue-800",
      instagram: "bg-pink-100 text-pink-800", 
      google: "bg-green-100 text-green-800",
      tiktok: "bg-black text-white",
      youtube: "bg-red-100 text-red-800",
      linkedin: "bg-blue-100 text-blue-800",
      twitter: "bg-sky-100 text-sky-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[platform] || colors.other
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const briefPageContent = (
    <div className="fixed inset-0 z-[9999] flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Ad Sections</h2>
        </div>
        
        <div className="space-y-1 flex-1">
          <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Performance
          </div>
          <div className="px-2 py-1 text-sm text-muted-foreground">
            <Target className="h-4 w-4 inline mr-2" />
            Creative Details
          </div>
          <div className="px-2 py-1 text-sm text-muted-foreground">
            <Lightbulb className="h-4 w-4 inline mr-2" />
            Strategy & Analysis
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-border space-y-2">
          {isEditMode ? (
            <>
              <Button onClick={handleSave} className="w-full">
                {isNewTopAd ? "Create Top Ad" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="w-full gap-2">
              <Edit className="h-4 w-4" />
              Edit Ad
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
                      value={editingTopAd?.adTitle || ""}
                      onChange={(e) => setEditingTopAd({ ...editingTopAd!, adTitle: e.target.value })}
                      placeholder="Enter ad title *"
                      className="text-3xl font-bold border-none p-0 h-auto bg-transparent"
                    />
                  ) : (
                    topAd.adTitle || "Untitled Ad"
                  )}
                  {isEditMode && <span className="text-red-500 ml-1">*</span>}
                </h1>
                <Badge className={getPlatformBadgeColor(topAd.platform)}>
                  {topAd.platform.charAt(0).toUpperCase() + topAd.platform.slice(1)}
                </Badge>
                <Badge className={getStatusBadgeColor(topAd.status)}>
                  {topAd.status.charAt(0).toUpperCase() + topAd.status.slice(1)}
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
                <h2 className="text-lg font-semibold mb-3">Platform & Campaign</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform *</label>
                    {isEditMode ? (
                      <select
                        value={editingTopAd?.platform}
                        onChange={(e) => setEditingTopAd({ ...editingTopAd!, platform: e.target.value as TopAd["platform"] })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Select platform</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="google">Google</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="twitter">Twitter</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-foreground">{topAd.platform.charAt(0).toUpperCase() + topAd.platform.slice(1)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    {renderField("Campaign Name", topAd.campaignName, "campaignName")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ad Set Name</label>
                    {renderField("Ad Set Name", topAd.adSetName, "adSetName")}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Performance Period</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={editingTopAd?.performanceStartDate || ""}
                        onChange={(e) => setEditingTopAd({ ...editingTopAd!, performanceStartDate: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-foreground">{topAd.performanceStartDate || "No start date"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={editingTopAd?.performanceEndDate || ""}
                        onChange={(e) => setEditingTopAd({ ...editingTopAd!, performanceEndDate: e.target.value })}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-foreground">{topAd.performanceEndDate || "No end date"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    {isEditMode ? (
                      <select
                        value={editingTopAd?.status}
                        onChange={(e) => setEditingTopAd({ ...editingTopAd!, status: e.target.value as TopAd["status"] })}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <Badge className={getStatusBadgeColor(topAd.status)}>
                        {topAd.status.charAt(0).toUpperCase() + topAd.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Spend</label>
                    {renderCurrencyField("Spend", topAd.spend, "spend")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Revenue</label>
                    {renderCurrencyField("Revenue", topAd.revenue, "revenue")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ROAS</label>
                    {renderNumberField("ROAS", topAd.roas, "roas", "e.g. 3.5")}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CTR (%)</label>
                    {renderPercentageField("CTR", topAd.ctr, "ctr")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CPM</label>
                    {renderCurrencyField("CPM", topAd.cpm, "cpm")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Conversion Rate (%)</label>
                    {renderPercentageField("Conversion Rate", topAd.conversionRate, "conversionRate")}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Impressions</label>
                    {renderNumberField("Impressions", topAd.impressions, "impressions", undefined, "1")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Clicks</label>
                    {renderNumberField("Clicks", topAd.clicks, "clicks", undefined, "1")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Conversions</label>
                    {renderNumberField("Conversions", topAd.conversions, "conversions", undefined, "1")}
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Ad Copy & Creative</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Headline</label>
                    {renderField("Headline", topAd.headline, "headline")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ad Copy</label>
                    {renderTextareaField("Ad Copy", topAd.adCopy, "adCopy", "Enter the full ad copy", 4)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Call to Action</label>
                    {renderField("Call to Action", topAd.callToAction, "callToAction")}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Links & Assets</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Creative URL</label>
                    {renderField("Creative URL", topAd.creativeUrl, "creativeUrl", "Link to image/video")}
                    {topAd.creativeUrl && !isEditMode && (
                      <a 
                        href={topAd.creativeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Creative
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Landing Page URL</label>
                    {renderField("Landing Page URL", topAd.landingPageUrl, "landingPageUrl")}
                    {topAd.landingPageUrl && !isEditMode && (
                      <a 
                        href={topAd.landingPageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Landing Page
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy & Analysis */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Strategy</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Angle/Hook</label>
                    {renderTextareaField("Angle/Hook", topAd.angle, "angle", "What angle or hook did this ad use?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Audience</label>
                    {renderField("Target Audience", topAd.targetAudience, "targetAudience")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Placement</label>
                    {renderField("Placement", topAd.placement, "placement", "e.g. Feed, Stories, etc.")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Objective</label>
                    {renderField("Objective", topAd.objective, "objective", "e.g. Conversion, Traffic, etc.")}
                  </div>
                </div>
              </div>

              <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
                <h2 className="text-lg font-semibold mb-3">Analysis & Insights</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Why It Worked</label>
                    {renderTextareaField("Why It Worked", topAd.whyItWorked, "whyItWorked", "What made this ad successful?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Key Insights</label>
                    {renderTextareaField("Key Insights", topAd.keyInsights, "keyInsights", "What can we learn from this ad?")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    {renderTextareaField("Notes", topAd.notes, "notes", "Additional notes about this ad")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render the brief page as a portal to document.body to ensure it's above everything
  return createPortal(briefPageContent, document.body)
}