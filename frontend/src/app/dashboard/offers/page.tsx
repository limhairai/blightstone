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
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, Edit3, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { offersApi } from "@/lib/api"
import { useProjectStore } from "@/lib/stores/project-store"
import { Offer } from "@/lib/stores/project-store"

const NEW_OFFER_ID = "new-offer-temp-id"

export default function OffersPage() {
  // Project store
  const { currentProjectId } = useProjectStore()

  // State for real data
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch offers for current project
  useEffect(() => {
    const fetchOffers = async () => {
      if (!currentProjectId) {
        setOffers([])
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const fetchedOffers = await offersApi.getByProject(currentProjectId)
        setOffers(fetchedOffers)
      } catch (err) {
        console.error('Failed to fetch offers:', err)
        setError('Failed to load offers')
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [currentProjectId])

  // UI State
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    url: "",
    description: ""
  })

  const handleNewOffer = () => {
    const newOffer: Offer = {
      id: NEW_OFFER_ID,
      name: "",
      price: "",
      url: "",
      projectId: currentProjectId || "",
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingOffer(newOffer)
    setFormData({ name: "", price: "", url: "", description: "" })
    setEditDialogOpen(true)
  }

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      name: offer.name,
      price: offer.price,
      url: offer.url || "",
      description: offer.description || ""
    })
    setEditDialogOpen(true)
  }

  const handleSaveOffer = async () => {
    if (!editingOffer || !formData.name.trim() || !formData.price.trim()) {
      toast.error('Please fill in offer name and price')
      return
    }

    setIsSaving(true)
    try {
      if (editingOffer.id === NEW_OFFER_ID) {
        // Creating a new offer
        const newOffer = await offersApi.create({
          name: formData.name.trim(),
          price: formData.price.trim(),
          url: formData.url.trim() || undefined,
          description: formData.description.trim() || undefined,
          projectId: currentProjectId || ""
        })
        setOffers(prev => [...prev, newOffer])
      } else {
        // Updating existing offer
        const updatedOffer = await offersApi.update(editingOffer.id, {
          name: formData.name.trim(),
          price: formData.price.trim(),
          url: formData.url.trim() || undefined,
          description: formData.description.trim() || undefined
        })
        setOffers(prev => prev.map(offer => 
          offer.id === updatedOffer.id ? updatedOffer : offer
        ))
      }
      
      setEditDialogOpen(false)
      setEditingOffer(null)
      setFormData({ name: "", price: "", url: "", description: "" })
      toast.success(editingOffer.id === NEW_OFFER_ID ? 'Offer created successfully!' : 'Offer updated successfully!')
    } catch (error) {
      console.error('Error saving offer:', error)
      toast.error('Failed to save offer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (offer: Offer) => {
    setOfferToDelete(offer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteOffer = async () => {
    if (!offerToDelete) return
    
    setIsDeleting(true)
    try {
      await offersApi.delete(offerToDelete.id)
      setOffers(prev => prev.filter(offer => offer.id !== offerToDelete.id))
      toast.success('Offer deleted successfully!')
    } catch (error) {
      console.error('Error deleting offer:', error)
      toast.error('Failed to delete offer. Please try again.')
    } finally {
      setIsDeleting(false)
      setOfferToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingOffer(null)
    setFormData({ name: "", price: "", url: "", description: "" })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading offers...
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
    <div className="space-y-6">
      <div className="flex justify-start">
        <Button onClick={handleNewOffer} className="gap-2">
          <Plus className="h-4 w-4" />
          New Offer
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Offer URL</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No offers found. Create your first offer to get started.
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.price}</TableCell>
                  <TableCell>
                    {offer.url ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => window.open(offer.url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Offer
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No URL</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {offer.description || 'No description'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOffer(offer)}
                        title="Edit offer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(offer)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete offer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOffer?.id === NEW_OFFER_ID ? "New Offer" : "Edit Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Offer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Basic Plan, Premium Package"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., $99, €50, Free"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Offer URL (optional)</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/offer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the offer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveOffer} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Offer"
        itemName={offerToDelete?.name}
        onConfirm={handleDeleteOffer}
        isLoading={isDeleting}
      />
    </div>
  )
}