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
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Plus, Edit3, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { adAccountsApi } from "@/lib/api"
import { useProjectStore } from "@/lib/stores/project-store"
import { AdAccount } from "@/lib/stores/project-store"

const NEW_AD_ACCOUNT_ID = "new-ad-account-temp-id"

export default function AdAccountsPage() {
  // Project store
  const { currentProjectId } = useProjectStore()

  // State for real data
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch ad accounts for current project
  useEffect(() => {
    const fetchAdAccounts = async () => {
      if (!currentProjectId) {
        setAdAccounts([])
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        const fetchedAdAccounts = await adAccountsApi.getByProject(currentProjectId)
        setAdAccounts(fetchedAdAccounts)
      } catch (err) {
        console.error('Failed to fetch ad accounts:', err)
        setError('Failed to load ad accounts')
      } finally {
        setLoading(false)
      }
    }

    fetchAdAccounts()
  }, [currentProjectId])

  // UI State
  const [editingAdAccount, setEditingAdAccount] = useState<AdAccount | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adAccountToDelete, setAdAccountToDelete] = useState<AdAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    businessManager: ""
  })

  const handleNewAdAccount = () => {
    const newAdAccount: AdAccount = {
      id: NEW_AD_ACCOUNT_ID,
      name: "",
      businessManager: "",
      projectId: currentProjectId || "",
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingAdAccount(newAdAccount)
    setFormData({ name: "", businessManager: "" })
    setEditDialogOpen(true)
  }

  const handleEditAdAccount = (adAccount: AdAccount) => {
    setEditingAdAccount(adAccount)
    setFormData({
      name: adAccount.name,
      businessManager: adAccount.businessManager
    })
    setEditDialogOpen(true)
  }

  const handleSaveAdAccount = async () => {
    if (!editingAdAccount || !formData.name.trim() || !formData.businessManager.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      if (editingAdAccount.id === NEW_AD_ACCOUNT_ID) {
        // Creating a new ad account
        const newAdAccount = await adAccountsApi.create({
          name: formData.name.trim(),
          businessManager: formData.businessManager.trim(),
          projectId: currentProjectId || ""
        })
        setAdAccounts(prev => [...prev, newAdAccount])
      } else {
        // Updating existing ad account
        const updatedAdAccount = await adAccountsApi.update(editingAdAccount.id, {
          name: formData.name.trim(),
          businessManager: formData.businessManager.trim()
        })
        setAdAccounts(prev => prev.map(account => 
          account.id === updatedAdAccount.id ? updatedAdAccount : account
        ))
      }
      
      setEditDialogOpen(false)
      setEditingAdAccount(null)
      setFormData({ name: "", businessManager: "" })
      toast.success(editingAdAccount.id === NEW_AD_ACCOUNT_ID ? 'Ad account created successfully!' : 'Ad account updated successfully!')
    } catch (error) {
      console.error('Error saving ad account:', error)
      toast.error('Failed to save ad account. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (adAccount: AdAccount) => {
    setAdAccountToDelete(adAccount)
    setDeleteDialogOpen(true)
  }

  const handleDeleteAdAccount = async () => {
    if (!adAccountToDelete) return
    
    setIsDeleting(true)
    try {
      await adAccountsApi.delete(adAccountToDelete.id)
      setAdAccounts(prev => prev.filter(account => account.id !== adAccountToDelete.id))
      toast.success('Ad account deleted successfully!')
    } catch (error) {
      console.error('Error deleting ad account:', error)
      toast.error('Failed to delete ad account. Please try again.')
    } finally {
      setIsDeleting(false)
      setAdAccountToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingAdAccount(null)
    setFormData({ name: "", businessManager: "" })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading ad accounts...
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
        <Button onClick={handleNewAdAccount} className="gap-2">
          <Plus className="h-4 w-4" />
          New Ad Account
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Account Name</TableHead>
              <TableHead>Business Manager</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No ad accounts found. Create your first ad account to get started.
                </TableCell>
              </TableRow>
            ) : (
              adAccounts.map((adAccount) => (
                <TableRow key={adAccount.id}>
                  <TableCell className="font-medium">{adAccount.name}</TableCell>
                  <TableCell>{adAccount.businessManager}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {adAccount.createdAt ? new Date(adAccount.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAdAccount(adAccount)}
                        title="Edit ad account"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(adAccount)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete ad account"
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
              {editingAdAccount?.id === NEW_AD_ACCOUNT_ID ? "New Ad Account" : "Edit Ad Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Account Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Ad Account, Testing Account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessManager">Business Manager</Label>
              <Input
                id="businessManager"
                value={formData.businessManager}
                onChange={(e) => setFormData(prev => ({ ...prev, businessManager: e.target.value }))}
                placeholder="e.g., Company BM, Client BM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdAccount} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Ad Account"
        itemName={adAccountToDelete?.name}
        onConfirm={handleDeleteAdAccount}
        isLoading={isDeleting}
      />
    </div>
  )
}