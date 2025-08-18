"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { InlineStatusDropdown, CREATIVE_STATUS_OPTIONS } from "@/components/ui/inline-status-dropdown"
import { InlineDatePicker } from "@/components/ui/inline-date-picker"
import { InlineAdAccountDropdown } from "@/components/ui/inline-ad-account-dropdown"
import { InlineOfferDropdown } from "@/components/ui/inline-offer-dropdown"
import { Plus, Eye, Edit3, Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
// Lazy load the brief page for better performance
const CreativeBriefPage = React.lazy(() => import("@/components/creative/creative-brief-page"))

import { useState, useEffect } from "react"
import { creativesApi, adAccountsApi, offersApi } from "@/lib/api"
import { useProjectStore, AdAccount, Offer } from "@/lib/stores/project-store"

// Define the interface for a Creative entry
interface Creative {
  id: string
  batch: string
  status: "draft" | "in-review" | "live" | "paused" | "completed"
  launchDate: string // YYYY-MM-DD
  campaignConcept: string
  batchNumber: number
  campaignId: string
  testHypothesis: string // "What are you creating/testing and what gives you the confidence this test will improve overall performance?"
  adType: string
  adVariable: string // "What was iterated"
  desire: string
  benefit: string // "Focus on pain points and objections to determine which benefits to highlight."
  objections: string
  persona: string // This will now be a string matching Persona.name
  hookPattern: string // "Desribe how the hook will look like"
  results: string
  winningAdLink: string // "All Winning Ads or Best Performing Ad"
  briefLink: string // "Link to Brief"
  driveLink: string // "Google Drive link for creative files"
  createdAt: string // "Date when the creative was created"
  notes?: string // "Quick notes about the creative"
  adAccountId?: string // "Ad account where this creative is deployed"
  offerId?: string // "Offer associated with this creative"
}

// Define the interface for a Persona entry (re-used from persona-page.tsx)
interface Persona {
  id: string
  name: string // Persona Type (Naming) - e.g., "Catherine (Mom, 35-50, stressed, sleep-deprived)"
  ageGenderLocation: string
  dailyStruggles: string
  desiredCharacteristics: string
  desiredSocialStatus: string
  productHelpAchieveStatus: string
  beliefsToOvercome: string
  failedSolutions: string
  marketAwareness: string
  marketSophistication: string
  insecurities: string
  mindset: string
  deeperPainPoints: string
  hiddenSpecificDesires: string
  objections: string
}

// Define a constant for a new creative's temporary ID
const NEW_CREATIVE_ID = "new-creative-temp-id"

export default function CreativeTrackerPage() {
  // Project store
  const { currentProjectId } = useProjectStore()

  // Campaign ID generation function
  const generateCampaignId = (creative: Creative, adAccounts: AdAccount[], offers: Offer[]) => {
    // Check if we have the minimum required data
    if (!creative.campaignConcept || !creative.adAccountId || !creative.offerId) {
      return ''
    }
    
    const adAccount = adAccounts.find(acc => acc.id === creative.adAccountId)
    const offer = offers.find(off => off.id === creative.offerId)
    
    if (!adAccount || !offer) return ''
    
    const adAccountName = adAccount.name.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '')
    const offerName = offer.name.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')
    const concept = creative.campaignConcept.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')
    const batchNum = (creative.batchNumber || 1).toString().padStart(2, '0')
    const today = new Date()
    const date = (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0')
    
    return `${adAccountName} - ${offerName} - ${concept} - ${batchNum} - ${date}`
  }

  // Copy campaign ID to clipboard
  const copyCampaignId = async (creative: Creative) => {
    const campaignId = generateCampaignId(creative, adAccounts, offers)
    if (!campaignId) {
      toast.error('Please select an ad account, offer, and add a campaign concept first')
      return
    }
    
    try {
      await navigator.clipboard.writeText(campaignId)
      toast.success('Campaign ID copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  
  // State for real data
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch creatives and ad accounts for current project
  useEffect(() => {
    const fetchData = async () => {
      if (!currentProjectId) {
        setCreatives([])
        setAdAccounts([])
        setOffers([])
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const [fetchedCreatives, fetchedAdAccounts, fetchedOffers] = await Promise.all([
          creativesApi.getByProject(currentProjectId),
          adAccountsApi.getByProject(currentProjectId),
          offersApi.getByProject(currentProjectId)
        ])
        setCreatives(fetchedCreatives)
        setAdAccounts(fetchedAdAccounts)
        setOffers(fetchedOffers)
      } catch (err) {
        setError('Failed to fetch data')
        console.error('Error fetching data:', err)
        setCreatives([])
        setAdAccounts([])
        setOffers([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [currentProjectId]) // Refetch when project changes

  // Production ready - using only real API data

  // Mock personas for the dropdown
  const [personas] = useState<Persona[]>([
    {
      id: "p1",
      name: "Catherine (Mom, 35-50, stressed, sleep-deprived)",
      ageGenderLocation: "Female - 35/60 - United States",
      dailyStruggles: "Bad Sleeper, Stress, Headache And Migraine",
      desiredCharacteristics: "Caring person, Organized, Health-Conscious, Thoughtful, Reliable",
      desiredSocialStatus:
        "Recognized for her ability to balance family, work, and personal life seamlessly. Known for her commitment to a healthy and sustainable lifestyle. Respected for her involvement in school, local events, or charitable causes. Admired by other moms for her wisdom, organization, and compassion.",
      productHelpAchieveStatus:
        "Restful sleep and reduced stress help her manage family life with ease. Shows her commitment to natural, holistic wellness for her and her family. Increased energy lets her stay active and involved. Balances health and family, inspiring other moms.",
      beliefsToOvercome:
        "Natural remedies take too long to work. Grounding products are complicated to use. I don't have time for self-care.",
      failedSolutions:
        "Sleep supplements: Left her groggy in the morning. Meditation apps: Hard to stay consistent. Expensive mattresses: Didn't resolve stress-related sleep issues.",
      marketAwareness: "Problem Aware",
      marketSophistication: "Low to Medium",
      insecurities:
        "Worried about being perceived as a tired, overwhelmed mom. Feels guilty if she's not prioritizing her family's health and her own self-care. Insecure about her lack of sleep and visible signs of exhaustion (e.g., dark circles, irritability).",
      mindset:
        "Catherine juggles multiple responsibilities daily—work, home, and family. She's always \"on,\" and her to-do list feels endless. She believes that caring for her family comes first, often putting her own well-being last. However, she craves peace of mind and sees solving her sleep and pain issues as a way to become more energized and present for her family.",
      deeperPainPoints:
        "Feeling exhausted and unable to give her best to her family. Waking up feeling more tired than when she went to bed. Emotional frustration from being spread too thin and lacking \"me time.\" Fear of long-term health issues due to poor sleep and constant body tension.",
      hiddenSpecificDesires:
        "To wake up feeling energized and ready to take on the day. To create a calm and nurturing environment for her family without feeling burned out. To have moments of uninterrupted rest and self-care. To maintain her health so she can stay active for her kids long-term. To look pretty without wrinkles or dark circles.",
      objections:
        "Will this really improve my sleep, or is it just another gimmick? I'm too busy to add another routine or product to my life. Is it safe to use around my children? What if it doesn't work as promised?",
    },
    {
      id: "p2",
      name: "David (Remote Worker, 28-45, tech-savvy, health-conscious)",
      ageGenderLocation: "Male - 28/45 - United States",
      dailyStruggles: "Fatigue, lack of focus, eye strain from screen time.",
      desiredCharacteristics: "Productive, efficient, healthy, innovative.",
      desiredSocialStatus: "Recognized as a high-performer, early adopter of wellness tech.",
      productHelpAchieveStatus: "Grounding mats boost focus and reduce fatigue, enhancing productivity.",
      beliefsToOvercome: "Skepticism about 'alternative' health, preference for tech solutions.",
      failedSolutions: "More coffee, energy drinks, ergonomic chairs (didn't address root cause).",
      marketAwareness: "Solution Aware",
      marketSophistication: "Medium",
      insecurities: "Worried about burnout, falling behind, not optimizing his health.",
      mindset: "Always seeking an edge, values efficiency and data-driven solutions.",
      deeperPainPoints: "Chronic low energy, mental fog, feeling disconnected from nature.",
      hiddenSpecificDesires:
        "Sustained energy without crashes, mental clarity, feeling more 'connected' to his environment.",
      objections: "Is it scientifically proven? Is it worth the desk space? Will it look good?",
    },
  ])

  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)
  const [notesEditingCreative, setNotesEditingCreative] = useState<Creative | null>(null)
  const [tempNotes, setTempNotes] = useState("")
  
  // Campaign concept editing state
  const [conceptEditingCreative, setConceptEditingCreative] = useState<Creative | null>(null)
  const [tempConcept, setTempConcept] = useState("")
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [creativeToDelete, setCreativeToDelete] = useState<Creative | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusColor = (status: Creative["status"]) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUpdateCreative = async (updatedCreative: Creative) => {
    try {
      if (updatedCreative.id === NEW_CREATIVE_ID) {
        // Create new creative
        const newCreative = await creativesApi.create({
          ...updatedCreative,
          projectId: currentProjectId || undefined
        })
        setCreatives([...creatives, newCreative])
        setSelectedCreative(null)
      } else {
        // Update existing creative
        const updated = await creativesApi.update(updatedCreative.id, updatedCreative)
        setCreatives(creatives.map((c) => (c.id === updatedCreative.id ? updated : c)))
        setSelectedCreative(updated)
      }
    } catch (err) {
      console.error('Error updating creative:', err)
      // You could add toast notification here
    }
  }

  const handleStatusChange = async (creativeId: string, newStatus: Creative["status"]) => {
    try {
      // Find the creative to update
      const creativeToUpdate = creatives.find(creative => creative.id === creativeId)
      if (!creativeToUpdate) return

      // Update the creative via API
      const updatedCreative = await creativesApi.update(creativeId, { ...creativeToUpdate, status: newStatus })
      
      // Update local state
      setCreatives(creatives.map(creative => 
        creative.id === creativeId ? updatedCreative : creative
      ))

      // Update selected creative if it's the one being updated
      if (selectedCreative && selectedCreative.id === creativeId) {
        setSelectedCreative(updatedCreative)
      }
    } catch (error) {
      console.error('Error updating creative status:', error)
      toast.error('Failed to update status. Please try again.')
    }
  }

  const handleLaunchDateChange = async (creativeId: string, newLaunchDate: string | null) => {
    try {
      // Find the creative to update
      const creativeToUpdate = creatives.find(creative => creative.id === creativeId)
      if (!creativeToUpdate) return

      // Update the creative via API
      const updatedCreative = await creativesApi.update(creativeId, { ...creativeToUpdate, launchDate: newLaunchDate || "" })
      
      // Update local state
      setCreatives(creatives.map(creative => 
        creative.id === creativeId ? updatedCreative : creative
      ))

      // Update selected creative if it's the one being updated
      if (selectedCreative && selectedCreative.id === creativeId) {
        setSelectedCreative(updatedCreative)
      }
    } catch (error) {
      console.error('Error updating creative launch date:', error)
      toast.error('Failed to update launch date. Please try again.')
    }
  }

  const handleAdAccountChange = async (creativeId: string, newAdAccountId: string | null) => {
    try {
      // Find the creative to update
      const creativeToUpdate = creatives.find(creative => creative.id === creativeId)
      if (!creativeToUpdate) return

      // Update the creative via API
      const updatedCreative = await creativesApi.update(creativeId, { ...creativeToUpdate, adAccountId: newAdAccountId })
      
      // Update local state
      setCreatives(creatives.map(creative => 
        creative.id === creativeId ? updatedCreative : creative
      ))

      // Update selected creative if it's the one being updated
      if (selectedCreative && selectedCreative.id === creativeId) {
        setSelectedCreative(updatedCreative)
      }
    } catch (error) {
      console.error('Error updating creative ad account:', error)
      toast.error('Failed to update ad account. Please try again.')
    }
  }

  const handleOfferChange = async (creativeId: string, newOfferId: string | null) => {
    try {
      // Find the creative to update
      const creativeToUpdate = creatives.find(creative => creative.id === creativeId)
      if (!creativeToUpdate) return

      // Update the creative via API
      const updatedCreative = await creativesApi.update(creativeId, { ...creativeToUpdate, offerId: newOfferId })
      
      // Update local state
      setCreatives(creatives.map(creative => 
        creative.id === creativeId ? updatedCreative : creative
      ))

      // Update selected creative if it's the one being updated
      if (selectedCreative && selectedCreative.id === creativeId) {
        setSelectedCreative(updatedCreative)
      }
    } catch (error) {
      console.error('Error updating creative offer:', error)
      toast.error('Failed to update offer. Please try again.')
    }
  }



  const handleNewCreativeClick = () => {
    setSelectedCreative({
      id: NEW_CREATIVE_ID,
      batch: "",
      status: "draft",
      launchDate: "",
      campaignConcept: "",
      batchNumber: 1,
      campaignId: "",
      testHypothesis: "",
      adType: "",
      adVariable: "",
      desire: "",
      benefit: "",
      objections: "",
      persona: "", // Default to empty string
      hookPattern: "",
      results: "",
      winningAdLink: "",
      briefLink: "",
      driveLink: "",
      createdAt: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const handleNotesEdit = (creative: Creative) => {
    setNotesEditingCreative(creative)
    setTempNotes(creative.notes || "")
  }

  const handleConceptEdit = (creative: Creative) => {
    setConceptEditingCreative(creative)
    setTempConcept(creative.campaignConcept || "")
  }

  const handleDeleteClick = (creative: Creative) => {
    setCreativeToDelete(creative)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCreative = async () => {
    if (!creativeToDelete) return
    
    setIsDeleting(true)
    try {
      await creativesApi.delete(creativeToDelete.id)
      setCreatives(prev => prev.filter(creative => creative.id !== creativeToDelete.id))
      if (selectedCreative && selectedCreative.id === creativeToDelete.id) {
        setSelectedCreative(null)
      }
    } catch (error) {
      console.error('Error deleting creative:', error)
      toast.error('Failed to delete creative. Please try again.')
    } finally {
      setIsDeleting(false)
      setCreativeToDelete(null)
    }
  }

  const handleNotesSave = async () => {
    if (!notesEditingCreative) return
    
    try {
      // Update the creative via API with new notes
      const updatedCreative = await creativesApi.update(notesEditingCreative.id, {
        ...notesEditingCreative,
        notes: tempNotes
      })
      
      // Update local state with the response from API
      setCreatives(creatives.map(creative => 
        creative.id === notesEditingCreative.id ? updatedCreative : creative
      ))
      
      // Update selected creative if it's the one being edited
      if (selectedCreative && selectedCreative.id === notesEditingCreative.id) {
        setSelectedCreative(updatedCreative)
      }
      
      setNotesEditingCreative(null)
      setTempNotes("")
      toast.success('Notes saved successfully!')
    } catch (error) {
      console.error('Error saving creative notes:', error)
      toast.error('Failed to save notes. Please try again.')
    }
  }

  const handleNotesCancel = () => {
    setNotesEditingCreative(null)
    setTempNotes("")
  }

  const handleConceptSave = async () => {
    if (!conceptEditingCreative) return
    
    try {
      // Update the creative via API with new campaign concept
      const updatedCreative = await creativesApi.update(conceptEditingCreative.id, {
        ...conceptEditingCreative,
        campaignConcept: tempConcept
      })
      
      // Update local state with the response from API
      setCreatives(creatives.map(creative => 
        creative.id === conceptEditingCreative.id ? updatedCreative : creative
      ))
      
      // Update selected creative if it's the one being edited
      if (selectedCreative && selectedCreative.id === conceptEditingCreative.id) {
        setSelectedCreative(updatedCreative)
      }
      
      setConceptEditingCreative(null)
      setTempConcept("")
      toast.success('Campaign concept saved successfully!')
    } catch (error) {
      console.error('Error saving campaign concept:', error)
      toast.error('Failed to save campaign concept. Please try again.')
    }
  }

  const handleConceptCancel = () => {
    setConceptEditingCreative(null)
    setTempConcept("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleNewCreativeClick} className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Creative
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign Concept</TableHead>
              <TableHead>Launch Date</TableHead>
              <TableHead>Ad Account</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Drive Link</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading creatives...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : creatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No creatives found. Create your first creative to get started.
                </TableCell>
              </TableRow>
            ) : creatives.map((creative) => (
              <TableRow key={creative.id}>
                <TableCell className="font-medium">{creative.batch}</TableCell>
                <TableCell>
                  <InlineStatusDropdown
                    currentStatus={creative.status}
                    statusOptions={CREATIVE_STATUS_OPTIONS}
                    onStatusChange={(newStatus) => handleStatusChange(creative.id, newStatus as Creative["status"])}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="max-w-32 truncate text-sm">
                      {creative.campaignConcept || "No concept"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConceptEdit(creative)
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <InlineDatePicker
                    currentDate={creative.launchDate}
                    onDateChange={(newDate) => handleLaunchDateChange(creative.id, newDate)}
                    placeholder="Set launch date"
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <InlineAdAccountDropdown
                    currentAdAccountId={creative.adAccountId}
                    adAccounts={adAccounts}
                    onAdAccountChange={(adAccountId) => handleAdAccountChange(creative.id, adAccountId)}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <InlineOfferDropdown
                    value={creative.offerId}
                    offers={offers}
                    onChange={(offerId) => handleOfferChange(creative.id, offerId)}
                  />
                </TableCell>
                <TableCell>
                  {creative.driveLink ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(creative.driveLink, '_blank')}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    >
                      Open Drive
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No link</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="max-w-24 truncate text-sm text-muted-foreground">
                      {creative.notes || "No notes"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotesEdit(creative)
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyCampaignId(creative)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Copy campaign ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCreative(creative)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(creative)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete creative"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Notes Edit Dialog */}
      <Dialog open={!!notesEditingCreative} onOpenChange={() => setNotesEditingCreative(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Creative: <span className="font-medium">{notesEditingCreative?.campaignConcept}</span>
              </p>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleNotesCancel}>
              Cancel
            </Button>
            <Button onClick={handleNotesSave}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Concept Editing Dialog */}
      <Dialog open={!!conceptEditingCreative} onOpenChange={() => setConceptEditingCreative(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Campaign Concept</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Creative: <span className="font-medium">{conceptEditingCreative?.batch}</span>
              </p>
              <Input
                value={tempConcept}
                onChange={(e) => setTempConcept(e.target.value)}
                placeholder="Enter campaign concept (e.g., PainTest, ScaleWin, RNR)"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Keep it short and descriptive for Facebook campaign names
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleConceptCancel}>
              Cancel
            </Button>
            <Button onClick={handleConceptSave}>
              Save Concept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Creative"
        itemName={creativeToDelete?.campaignConcept || creativeToDelete?.batch}
        onConfirm={handleDeleteCreative}
        isLoading={isDeleting}
      />

      {/* Creative Brief Page (Full-screen overlay) */}
      {selectedCreative && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">Loading...</div>}>
          <CreativeBriefPage
            creative={selectedCreative}
            onClose={() => setSelectedCreative(null)}
            onUpdateCreative={handleUpdateCreative}
            onDeleteCreative={(creativeId: string) => {
              const creative = creatives.find(c => c.id === creativeId)
              if (creative) handleDeleteClick(creative)
            }}
            NEW_CREATIVE_ID={NEW_CREATIVE_ID}
          />
        </React.Suspense>
      )}
    </div>
  )
}