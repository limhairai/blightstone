"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  X, 
  FileIcon, 
  Image, 
  Video, 
  FileText,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen
} from "lucide-react"
import { toast } from "sonner"
import JSZip from "jszip"

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
  extractedFrom?: string // For files extracted from ZIP
}

interface MultiFileUploadProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (files: any[]) => void
  projectId: string
  currentFolderId?: string | null
  folders: Array<{ id: string; name: string }>
}

const CATEGORY_OPTIONS = [
  { value: 'creative', label: 'Creative' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'general', label: 'General' }
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_FILES = 50 // Maximum files in one batch

export function MultiFileUpload({ 
  isOpen, 
  onClose, 
  onUploadComplete, 
  projectId, 
  currentFolderId,
  folders 
}: MultiFileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSettings, setUploadSettings] = useState({
    category: 'creative',
    folderId: currentFolderId || 'none',
    description: '',
    tags: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Archive className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
    }
    return null
  }

  const extractZipFile = async (zipFile: File): Promise<File[]> => {
    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(zipFile)
      const extractedFiles: File[] = []

      for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/')) {
          const blob = await zipEntry.async('blob')
          const fileName = relativePath.split('/').pop() || relativePath
          const file = new File([blob], fileName, { type: blob.type })
          extractedFiles.push(file)
        }
      }

      return extractedFiles
    } catch (error) {
      console.error('Error extracting ZIP:', error)
      throw new Error('Failed to extract ZIP file')
    }
  }

  const processFiles = async (files: File[]) => {
    const newUploadFiles: UploadFile[] = []
    const zipFiles: File[] = []
    const regularFiles: File[] = []

    // Separate ZIP files from regular files
    for (const file of files) {
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        zipFiles.push(file)
      } else {
        regularFiles.push(file)
      }
    }

    // Process regular files
    for (const file of regularFiles) {
      const error = validateFile(file)
              newUploadFiles.push({
          id: generateId(),
          file,
          status: error ? 'error' : 'pending',
          progress: 0,
          error: error || undefined
        })
    }

    // Process ZIP files
    for (const zipFile of zipFiles) {
      try {
        toast.info(`Extracting ${zipFile.name}...`)
        const extractedFiles = await extractZipFile(zipFile)
        
        for (const extractedFile of extractedFiles) {
          const error = validateFile(extractedFile)
          newUploadFiles.push({
            id: generateId(),
            file: extractedFile,
            status: error ? 'error' : 'pending',
            progress: 0,
            error: error || undefined,
            extractedFrom: zipFile.name
          })
        }

        toast.success(`Extracted ${extractedFiles.length} files from ${zipFile.name}`)
      } catch (error) {
        newUploadFiles.push({
          id: generateId(),
          file: zipFile,
          status: 'error',
          progress: 0,
          error: 'Failed to extract ZIP file'
        })
        toast.error(`Failed to extract ${zipFile.name}`)
      }
    }

    // Check total file count
    const totalFiles = uploadFiles.length + newUploadFiles.length
    if (totalFiles > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed. Please remove some files.`)
      return
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      processFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('project_id', projectId)
      formData.append('category', uploadSettings.category)
      formData.append('description', uploadSettings.description)
      formData.append('tags', uploadSettings.tags)
      formData.append('created_by', 'current-user@example.com') // TODO: Get from auth context

      if (uploadSettings.folderId && uploadSettings.folderId !== 'none') {
        formData.append('folder_id', uploadSettings.folderId)
      }

      // Simulate progress (since fetch doesn't support upload progress)
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id && f.status === 'uploading' 
            ? { ...f, progress: Math.min(f.progress + 10, 90) } 
            : f
        ))
      }, 200)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100 } 
          : f
      ))

      return true
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Upload failed' } 
          : f
      ))
      return false
    }
  }

  const handleUploadAll = async () => {
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending')
    if (filesToUpload.length === 0) return

    setIsUploading(true)
    const successfulUploads: any[] = []
    let completedCount = 0

    // Upload files in batches of 3 for better performance
    const batchSize = 3
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
      const batch = filesToUpload.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (uploadFile) => {
          const success = await uploadSingleFile(uploadFile)
          if (success) {
            successfulUploads.push(uploadFile.file)
          }
          completedCount++
        })
      )
    }

    setIsUploading(false)

    if (successfulUploads.length > 0) {
      toast.success(`Successfully uploaded ${successfulUploads.length} files!`)
      onUploadComplete(successfulUploads)
    }

    const failedCount = filesToUpload.length - successfulUploads.length
    if (failedCount > 0) {
      toast.error(`${failedCount} files failed to upload`)
    }
  }

  const handleClose = () => {
    if (isUploading) {
      toast.error('Cannot close while uploading')
      return
    }
    setUploadFiles([])
    setUploadSettings({
      category: 'creative',
      folderId: currentFolderId || 'none',
      description: '',
      tags: ''
    })
    onClose()
  }

  const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
  const completedFiles = uploadFiles.filter(f => f.status === 'completed')
  const errorFiles = uploadFiles.filter(f => f.status === 'error')
  const totalFiles = uploadFiles.length
  const totalSize = uploadFiles.reduce((sum, f) => sum + f.file.size, 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Upload Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={uploadSettings.category} 
                onValueChange={(value) => setUploadSettings(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Folder</Label>
              <Select 
                value={uploadSettings.folderId} 
                onValueChange={(value) => setUploadSettings(prev => ({ ...prev, folderId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Description (optional)</Label>
              <Input
                value={uploadSettings.description}
                onChange={(e) => setUploadSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="File description"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <Input
                value={uploadSettings.tags}
                onChange={(e) => setUploadSettings(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports individual files and ZIP archives • Max {formatFileSize(MAX_FILE_SIZE)} per file • Up to {MAX_FILES} files
                </p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </div>

          {/* File List */}
          {totalFiles > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {totalFiles} files • {formatFileSize(totalSize)}
                  </span>
                  {completedFiles.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {completedFiles.length} completed
                    </Badge>
                  )}
                  {errorFiles.length > 0 && (
                    <Badge variant="destructive">
                      {errorFiles.length} errors
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setUploadFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg">
                <div className="space-y-1 p-2">
                  {uploadFiles.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(uploadFile.file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {uploadFile.file.name}
                          </p>
                          {uploadFile.extractedFrom && (
                            <Badge variant="outline" className="text-xs">
                              from {uploadFile.extractedFrom}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                        
                        {uploadFile.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={uploadFile.progress} className="h-1" />
                          </div>
                        )}
                        
                        {uploadFile.error && (
                          <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        {uploadFile.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        {uploadFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        
                        {!isUploading && uploadFile.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleUploadAll} 
            disabled={pendingFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${pendingFiles.length} Files`
            )}
          </Button>
        </DialogFooter>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />
      </DialogContent>
    </Dialog>
  )
}