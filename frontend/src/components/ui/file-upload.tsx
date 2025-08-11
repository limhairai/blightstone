"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, FileText, Image, X } from "lucide-react"
import { supabase } from "@/services/supabase-service"
import { useAuth } from "@/contexts/AuthContext"

interface FileUploadProps {
  onUpload: (attachment: {
    id: string
    name: string
    url: string
    type: string
    size: number
    uploadedAt: string
  }) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  bucket?: string
}

export function FileUpload({ 
  onUpload, 
  accept = "image/*,.pdf,.doc,.docx,.txt", 
  maxSizeMB = 10,
  disabled = false,
  bucket = "task-attachments"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    // Check file type (basic validation)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload images, PDFs, or documents.'
    }

    return null
  }

  const uploadFile = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload files')
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        toast.error(`Upload failed: ${error.message}`)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // Create attachment object
      const attachment = {
        id: Date.now().toString(),
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }

      // Call the onUpload callback
      onUpload(attachment)
      
      toast.success(`${file.name} uploaded successfully!`)
      setProgress(100)
      
      // Reset progress after a brief delay
      setTimeout(() => setProgress(0), 1000)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    
    const file = event.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-2">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
      />

      {/* Upload Button & Drag Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className={`h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              Images, PDFs, and documents up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {uploading && progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Upload Button (Alternative) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? 'Uploading...' : 'Choose File'}
      </Button>
    </div>
  )
}

export default FileUpload