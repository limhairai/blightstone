"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, TrendingUp, Eye, ExternalLink, Edit3 } from "lucide-react"
// Lazy load the brief page for better performance
const TopAdBriefPage = React.lazy(() => import("@/components/top-ads/top-ad-brief-page"))
import { useProjectStore } from "@/lib/stores/project-store"
import { topAdsApi } from "@/lib/api"

// Import interfaces from project store
import { TopAd } from "@/lib/stores/project-store"

// Define a constant for a new top ad's temporary ID
const NEW_TOP_AD_ID = "new-top-ad-temp-id"

export default function TopAdsPage() {
  const { currentProjectId } = useProjectStore()
  
  // State for real data
  const [topAds, setTopAds] = useState<TopAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch top ads when project changes
  useEffect(() => {
    if (!currentProjectId) return
    
    const fetchTopAds = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedTopAds = await topAdsApi.getByProject(currentProjectId)
        setTopAds(fetchedTopAds)
      } catch (err) {
        console.error('Failed to fetch top ads:', err)
        setError('Failed to load top ads')
      } finally {
        setLoading(false)
      }
    }

    fetchTopAds()
  }, [currentProjectId])
  
  // UI State
  const [selectedTopAd, setSelectedTopAd] = useState<TopAd | null>(null)
  const [showBrief, setShowBrief] = useState(false)
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; topAd: TopAd | null }>({ open: false, topAd: null })
  const [notesText, setNotesText] = useState("")

  const handleNewTopAd = () => {
    const newTopAd: TopAd = {
      id: NEW_TOP_AD_ID,
      projectId: currentProjectId!,
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adTitle: "",
      platform: "facebook",
      status: "active"
    }
    setSelectedTopAd(newTopAd)
    setShowBrief(true)
  }

  const handleViewTopAd = (topAd: TopAd) => {
    setSelectedTopAd(topAd)
    setShowBrief(true)
  }

  const handleUpdateTopAd = async (updatedTopAd: TopAd) => {
    if (!currentProjectId) return
    
    try {
      if (updatedTopAd.id === NEW_TOP_AD_ID) {
        // Creating a new top ad
        const { id, ...topAdData } = updatedTopAd
        const newTopAd = await topAdsApi.create({
          ...topAdData,
          projectId: currentProjectId
        })
        // Convert back to local format and add to state
        const convertedTopAd: TopAd = {
          id: newTopAd.id,
          projectId: newTopAd.projectId || currentProjectId,
          createdBy: newTopAd.createdBy || "",
          createdAt: newTopAd.createdAt || new Date().toISOString(),
          updatedAt: newTopAd.updatedAt || new Date().toISOString(),
          adTitle: newTopAd.adTitle || "",
          platform: newTopAd.platform || "facebook",
          campaignName: newTopAd.campaignName || "",
          adSetName: newTopAd.adSetName || "",
          spend: newTopAd.spend,
          revenue: newTopAd.revenue,
          roas: newTopAd.roas,
          ctr: newTopAd.ctr,
          cpm: newTopAd.cpm,
          conversionRate: newTopAd.conversionRate,
          costPerConversion: newTopAd.costPerConversion,
          impressions: newTopAd.impressions,
          clicks: newTopAd.clicks,
          conversions: newTopAd.conversions,
          performanceStartDate: newTopAd.performanceStartDate,
          performanceEndDate: newTopAd.performanceEndDate,
          adCopy: newTopAd.adCopy,
          headline: newTopAd.headline,
          callToAction: newTopAd.callToAction,
          creativeUrl: newTopAd.creativeUrl,
          landingPageUrl: newTopAd.landingPageUrl,
          angle: newTopAd.angle,
          targetAudience: newTopAd.targetAudience,
          placement: newTopAd.placement,
          objective: newTopAd.objective,
          notes: newTopAd.notes,
          whyItWorked: newTopAd.whyItWorked,
          keyInsights: newTopAd.keyInsights,
          status: newTopAd.status || "active"
        }
        setTopAds(prev => [...prev, convertedTopAd])
      } else {
        // Updating existing top ad
        const updated = await topAdsApi.update(updatedTopAd.id, updatedTopAd)
        setTopAds(prev => prev.map(topAd => topAd.id === updated.id ? { ...topAd, ...updatedTopAd } : topAd))
      }
      setSelectedTopAd(null)
      setShowBrief(false)
    } catch (error) {
      console.error('Error updating top ad:', error)
      alert('Failed to save top ad. Please try again.')
    }
  }

  const handleNotesEdit = (topAd: TopAd) => {
    setNotesDialog({ open: true, topAd })
    setNotesText(topAd.notes || "")
  }

  const handleNotesSave = async () => {
    if (!notesDialog.topAd) return
    
    try {
      const updatedTopAd = { ...notesDialog.topAd, notes: notesText }
      await topAdsApi.update(notesDialog.topAd.id, updatedTopAd)
      setTopAds(prev => prev.map(topAd => 
        topAd.id === notesDialog.topAd!.id ? { ...topAd, notes: notesText } : topAd
      ))
      setNotesDialog({ open: false, topAd: null })
      setNotesText("")
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes. Please try again.')
    }
  }

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      instagram: "bg-pink-100 text-pink-800 hover:bg-pink-200", 
      google: "bg-green-100 text-green-800 hover:bg-green-200",
      tiktok: "bg-black text-white hover:bg-gray-800",
      youtube: "bg-red-100 text-red-800 hover:bg-red-200",
      linkedin: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      twitter: "bg-sky-100 text-sky-800 hover:bg-sky-200",
      other: "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
    return colors[platform] || colors.other
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return "-"
    return `$${value.toLocaleString()}`
  }

  const formatPercentage = (value?: number) => {
    if (!value) return "-"
    return `${value.toFixed(2)}%`
  }

  const formatNumber = (value?: number) => {
    if (!value) return "-"
    return value.toLocaleString()
  }

  if (!currentProjectId) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Please select a project to view top ads.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading top ads...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Top Ads Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your highest-performing ads to identify winning patterns and angles.
          </p>
        </div>
        <Button onClick={handleNewTopAd} className="gap-2">
          <Plus className="h-4 w-4" />
          New Top Ad
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Title</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Angle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No top ads found. Create your first top ad to start tracking winning creatives.
                  </TableCell>
                </TableRow>
              ) : (
                topAds.map((topAd) => (
                  <TableRow 
                    key={topAd.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewTopAd(topAd)}
                  >
                    <TableCell className="font-medium">{topAd.adTitle}</TableCell>
                    <TableCell>
                      <Badge className={getPlatformBadgeColor(topAd.platform)}>
                        {topAd.platform.charAt(0).toUpperCase() + topAd.platform.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {topAd.roas ? `${topAd.roas.toFixed(2)}x` : "-"}
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(topAd.spend)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(topAd.revenue)}</TableCell>
                    <TableCell className="font-mono">{formatPercentage(topAd.ctr)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{topAd.angle || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(topAd.status)}>
                        {topAd.status.charAt(0).toUpperCase() + topAd.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {topAd.notes ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotesEdit(topAd)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {topAd.notes.slice(0, 20)}...
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotesEdit(topAd)
                          }}
                          className="h-6 px-2 text-xs text-muted-foreground"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Add notes
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewTopAd(topAd)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Brief Dialog */}
      {showBrief && selectedTopAd && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <TopAdBriefPage
            topAd={selectedTopAd}
            onClose={() => {
              setShowBrief(false)
              setSelectedTopAd(null)
            }}
            onUpdateTopAd={handleUpdateTopAd}
            isNewTopAd={selectedTopAd.id === NEW_TOP_AD_ID}
          />
        </React.Suspense>
      )}

      {/* Notes Edit Dialog */}
      <Dialog open={notesDialog.open} onOpenChange={(open) => !open && setNotesDialog({ open: false, topAd: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your notes about this ad..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog({ open: false, topAd: null })}>
              Cancel
            </Button>
            <Button onClick={handleNotesSave}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}