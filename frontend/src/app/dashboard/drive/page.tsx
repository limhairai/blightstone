"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { 
  Upload, 
  File as FileIcon, 
  Image, 
  Video, 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  Search,
  Folder,
  FolderPlus,
  ChevronRight,
  Home
} from "lucide-react"
import { toast } from "sonner"

import { filesApi, foldersApi } from "@/lib/api"
import { useProjectStore } from "@/lib/stores/project-store"
import { File, Folder as FolderType } from "@/lib/stores/project-store"
import { FileThumbnail } from "@/components/ui/file-thumbnail"
import { FilePreviewModal } from "@/components/ui/file-preview-modal"
import { MultiFileUpload } from "@/components/ui/multi-file-upload"

const CATEGORY_OPTIONS = [
  { value: 'creative', label: 'Creative' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'general', label: 'General' }
]

const CATEGORY_ICONS = {
  creative: FileIcon,
  document: FileText,
  image: Image,
  video: Video,
  general: FileIcon
}

export default function DrivePage() {
  const { currentProjectId } = useProjectStore()
  
  // State
  const [files, setFiles] = useState<File[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [currentFolderPath, setCurrentFolderPath] = useState<FolderType[]>([]) // Breadcrumb path
  
  // Multi-file upload dialog state
  const [multiUploadDialogOpen, setMultiUploadDialogOpen] = useState(false)
  

  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<File | null>(null)
  const [editFormData, setEditFormData] = useState({
    category: 'creative',
    folderId: 'none',
    description: '',
    tags: ''
  })
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<File | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Create folder dialog state
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  
  // Preview modal state
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Load data
  const loadData = async () => {
    if (!currentProjectId) return
    
    try {
      setLoading(true)
      console.log('Loading files and folders for project:', currentProjectId)
      
      const [filesData, foldersData] = await Promise.all([
        filesApi.getAll({ projectId: currentProjectId }),
        foldersApi.getAll(currentProjectId)
      ])
      
      console.log('Loaded files:', filesData)
      console.log('Loaded folders:', foldersData)
      
      setFiles(filesData)
      setFolders(foldersData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load files and folders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentProjectId])

  const handleUploadClick = () => {
    setMultiUploadDialogOpen(true)
  }

  const handleUploadComplete = (uploadedFiles: any[]) => {
    // Reload data to get the latest files from server
    loadData()
    setMultiUploadDialogOpen(false)
  }

  const handleEdit = (file: File) => {
    setEditingFile(file)
    setEditFormData({
      category: file.category,
      folderId: file.folderId || 'none',
      description: file.description || '',
      tags: file.tags?.join(', ') || ''
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingFile || !currentProjectId) return

    try {
      const updatedFile = await filesApi.update(editingFile.id, {
        category: editFormData.category as 'creative' | 'document' | 'image' | 'video' | 'general',
        folderId: editFormData.folderId === 'none' ? undefined : editFormData.folderId,
        description: editFormData.description,
        tags: editFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      })

      setFiles(prev => prev.map(file => 
        file.id === editingFile.id ? updatedFile : file
      ))
      
      setEditDialogOpen(false)
      setEditingFile(null)
      toast.success('File updated successfully!')
    } catch (error) {
      console.error('Error updating file:', error)
      toast.error('Failed to update file')
    }
  }

  const handleDeleteFile = (file: File) => {
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    try {
      setIsDeleting(true)
      await filesApi.delete(fileToDelete.id)
      setFiles(prev => prev.filter(file => file.id !== fileToDelete.id))
      setDeleteDialogOpen(false)
      setFileToDelete(null)
      toast.success('File deleted successfully!')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to build folder path for breadcrumbs
  const buildFolderPath = (folderId: string | null): FolderType[] => {
    if (!folderId) return []
    
    const path: FolderType[] = []
    let currentId: string | null = folderId
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId)
      if (!folder) break
      
      path.unshift(folder) // Add to beginning
      currentId = folder.parentFolderId || null
    }
    
    return path
  }

  const handleFolderNavigation = (folderId: string | null) => {
    setSelectedFolder(folderId)
    setCurrentFolderPath(buildFolderPath(folderId))
  }

  const handleGoBack = () => {
    if (currentFolderPath.length === 0) {
      // If we're at root level of a folder, go back to main drive
      handleFolderNavigation(null)
    } else {
      // Go back to the parent folder (one level up)
      const parentFolder = currentFolderPath[currentFolderPath.length - 1]
      const grandParentId = parentFolder.parentFolderId
      handleFolderNavigation(grandParentId || null)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentProjectId) return

    try {
      setIsCreatingFolder(true)
      const newFolder = await foldersApi.create({
        name: newFolderName.trim(),
        projectId: currentProjectId,
        parentFolderId: selectedFolder, // Create in current folder
        createdBy: 'current-user@example.com' // TODO: Get from auth context
      })
      
      console.log('Created folder:', newFolder)
      
      // Add to local state
      setFolders(prev => [...prev, newFolder])
      
      // Also reload data to ensure consistency
      await loadData()
      
      setCreateFolderDialogOpen(false)
      setNewFolderName('')
      toast.success(`Folder "${newFolder.name}" created successfully!`)
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleDownload = async (file: File) => {
    try {
      const signedUrl = await filesApi.getSignedUrl(file.filePath)
      if (signedUrl) {
        const link = document.createElement('a')
        link.href = signedUrl
        link.download = file.originalName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Download started!')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handlePreviewFile = (file: File) => {
    setPreviewFile(file)
    setPreviewModalOpen(true)
  }

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (!previewFile || !filteredFiles.length) return
    
    const currentIndex = filteredFiles.findIndex(f => f.id === previewFile.id)
    let newIndex
    
    if (direction === 'next') {
      newIndex = currentIndex < filteredFiles.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredFiles.length - 1
    }
    
    setPreviewFile(filteredFiles[newIndex])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || FileIcon
    return <Icon className="h-5 w-5" />
  }

  // Get current folder info
  const currentFolder = selectedFolder === 'unorganized' 
    ? { name: 'Unorganized Files' }
    : folders.find(f => f.id === selectedFolder)

  // Filter files based on selected folder and search
  const filteredFiles = files.filter(file => {
    // Folder filtering
    if (selectedFolder === 'unorganized') {
      if (file.folderId) return false
    } else if (selectedFolder) {
      if (file.folderId !== selectedFolder) return false
    }
    
    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        file.originalName?.toLowerCase().includes(searchLower) ||
        file.description?.toLowerCase().includes(searchLower) ||
        file.category.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Get folders for display (only folders in current directory)
  const currentFolders = folders.filter(folder => folder.parentFolderId === selectedFolder)
  
  const folderList = currentFolders.map(folder => ({
    ...folder,
    fileCount: files.filter(f => f.folderId === folder.id).length
  }))

  // Get unorganized files count
  const unorganizedCount = files.filter(f => !f.folderId).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!selectedFolder) {
    // Folder view
    return (
      <div className="min-h-screen bg-white">


        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          {/* Breadcrumb Navigation */}
          {(selectedFolder || currentFolderPath.length > 0) && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFolderNavigation(null)}
                className="h-8 px-2"
              >
                <Home className="h-4 w-4 mr-1" />
                Drive
              </Button>
              
              {currentFolderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFolderNavigation(folder.id)}
                    className="h-8 px-2"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in Drive"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateFolderDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button onClick={handleUploadClick}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="p-6">
          {folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No folders or files</h3>
              <p className="text-gray-500 mb-4">Get started by creating a folder or uploading files</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
                <Button onClick={handleUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-4">
              {/* Folders */}
              {folderList.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                  onClick={() => handleFolderNavigation(folder.id)}
                >
                  <div className="text-center">
                    <div className="mb-2">
                      <Folder className="h-12 w-12 mx-auto text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">{folder.name}</p>
                    <p className="text-xs text-gray-500">{folder.fileCount} files</p>
                  </div>
                </div>
              ))}
              
              {/* Unorganized Files Folder */}
              {unorganizedCount > 0 && (
                <div
                  className="group relative p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                  onClick={() => handleFolderNavigation('unorganized')}
                >
                  <div className="text-center">
                    <div className="mb-2">
                      <Folder className="h-12 w-12 mx-auto text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">Unorganized Files</p>
                    <p className="text-xs text-gray-500">{unorganizedCount} files</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={isCreatingFolder}>
                {isCreatingFolder ? "Creating..." : "Create Folder"}
              </Button>
                      </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-File Upload Dialog */}
      <MultiFileUpload
        isOpen={multiUploadDialogOpen}
        onClose={() => setMultiUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        projectId={currentProjectId || ''}
        currentFolderId={selectedFolder}
        folders={folders}
      />
      </div>
    )
  }

  // File view inside folder
  return (
    <div className="min-h-screen bg-white">


      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleGoBack}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              ← Back
            </Button>
            <h1 className="text-lg font-medium">{currentFolder?.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border-gray-300"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCreateFolderDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={handleUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      {/* Files and Folders Grid */}
      <div className="p-6">
        {filteredFiles.length === 0 && currentFolders.length === 0 ? (
          <div className="text-center py-12">
            <FileIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files or folders in this folder</h3>
            <p className="text-gray-500 mb-4">Upload files or create folders to get started</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
              <Button onClick={handleUploadClick}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {/* Subfolders first */}
            {currentFolders.map((folder) => (
              <div
                key={folder.id}
                className="group relative p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                onClick={() => handleFolderNavigation(folder.id)}
              >
                <div className="text-center">
                  <div className="mb-2">
                    <Folder className="h-12 w-12 mx-auto text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">{folder.name}</p>
                  <p className="text-xs text-gray-500">{files.filter(f => f.folderId === folder.id).length} files</p>
                </div>
              </div>
            ))}
            
            {/* Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group relative p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="text-center">
                  <div className="mb-2 flex justify-center">
                    <FileThumbnail 
                      file={{
                        id: file.id,
                        originalName: file.originalName,
                        filePath: file.filePath,
                        mimeType: file.mimeType,
                        category: file.category,
                        fileSize: file.fileSize
                      }} 
                      size="md"
                      onClick={() => handlePreviewFile(file)}
                    />
                  </div>
                  <p 
                    className="text-sm font-medium text-gray-900 truncate mb-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handlePreviewFile(file)}
                  >
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                  
                  {/* Actions on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-File Upload Dialog */}
      <MultiFileUpload
        isOpen={multiUploadDialogOpen}
        onClose={() => setMultiUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        projectId={currentProjectId || ''}
        currentFolderId={selectedFolder}
        folders={folders}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">File Name</Label>
              <div className="p-2 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-900 break-all" title={editingFile?.originalName}>
                  {editingFile?.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {editingFile ? `${(editingFile.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editCategory" className="text-sm font-medium">Category</Label>
              <Select value={editFormData.category} onValueChange={(value) => 
                setEditFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editFolder" className="text-sm font-medium">Folder</Label>
              <Select value={editFormData.folderId} onValueChange={(value) => 
                setEditFormData(prev => ({ ...prev, folderId: value }))
              }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder (unorganized)</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editDescription" className="text-sm font-medium">Description</Label>
              <Input
                id="editDescription"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="File description"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editTags" className="text-sm font-medium">Tags</Label>
              <Input
                id="editTags"
                value={editFormData.tags}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="flex-1">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateFolderDialogOpen(false)
                setNewFolderName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete File"
        description={`Are you sure you want to delete "${fileToDelete?.originalName}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setPreviewFile(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDeleteFile}
        onDownload={handleDownload}
        files={filteredFiles}
        currentIndex={previewFile ? filteredFiles.findIndex(f => f.id === previewFile.id) : undefined}
        onNavigate={handleNavigatePreview}
      />
    </div>
  )
}