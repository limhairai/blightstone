"use client"

import { useState, useRef } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Badge } from "./badge"
import { Upload, X, Play, Pause, Image, Video, File, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MediaUploadProps {
  value?: string // Current media URL
  onChange: (url: string | null) => void
  onFileUpload?: (file: File) => Promise<string> // Custom upload handler
  accept?: string // File types to accept
  maxSize?: number // Max file size in MB
  className?: string
  placeholder?: string
  projectId?: string
  category?: string
  createdBy?: string
}

export function MediaUpload({
  value,
  onChange,
  onFileUpload,
  accept = "image/*,video/*",
  maxSize = 50, // 50MB default
  className,
  placeholder = "Upload media or paste URL",
  projectId,
  category = "creative-intelligence",
  createdBy
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setIsUploading(true)

    try {
      if (onFileUpload) {
        // Use custom upload handler
        const url = await onFileUpload(file)
        onChange(url)
        toast.success("Media uploaded successfully")
      } else if (projectId && createdBy) {
        // Use default Supabase upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project_id', projectId)
        formData.append('category', category)
        formData.append('created_by', createdBy)
        formData.append('description', `Creative Intelligence Media: ${file.name}`)

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        onChange(data.signedUrl || data.filePath)
        toast.success("Media uploaded successfully")
      } else {
        toast.error("Missing required upload parameters")
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload media")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput("")
      setShowUrlInput(false)
      toast.success("Media URL added")
    }
  }

  const handleRemove = () => {
    onChange(null)
    setUrlInput("")
    setShowUrlInput(false)
  }

  const getMediaType = (url: string) => {
    if (!url) return 'unknown'
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image'
    }
    if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'video'
    }
    return 'unknown'
  }

  const MediaPreview = ({ url }: { url: string }) => {
    const [videoPlaying, setVideoPlaying] = useState(false)
    const [showImageModal, setShowImageModal] = useState(false)
    const mediaType = getMediaType(url)

    if (mediaType === 'image') {
      return (
        <>
          <div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
            <img
              src={url}
              alt="Uploaded media"
              className="w-full h-48 object-cover rounded-lg transition-transform hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowImageModal(true)
                }}
                className="gap-2"
              >
                <Image className="h-4 w-4" />
                View Full Size
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(url, '_blank')
                }}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
          
          {/* Full Size Image Modal */}
          {showImageModal && (
            <div 
              className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
              onClick={() => setShowImageModal(false)}
            >
              <div className="relative max-w-[95vw] max-h-[95vh]">
                <img
                  src={url}
                  alt="Full size view"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  className="absolute top-4 left-4 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </>
      )
    }

    if (mediaType === 'video') {
      return (
        <div className="relative group">
          <video
            src={url}
            className="w-full h-48 object-cover rounded-lg cursor-pointer"
            controls={videoPlaying}
            muted
            loop
            onClick={() => setVideoPlaying(!videoPlaying)}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
          />
          {!videoPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg group-hover:bg-opacity-50 transition-all">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setVideoPlaying(true)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Full
                </Button>
              </div>
            </div>
          )}
          {videoPlaying && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg">
        <File className="h-8 w-8 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Media file</p>
          <p className="text-xs text-muted-foreground">{url}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          Open
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {value ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              {getMediaType(value) === 'image' && <Image className="h-3 w-3" />}
              {getMediaType(value) === 'video' && <Video className="h-3 w-3" />}
              {getMediaType(value) === 'unknown' && <File className="h-3 w-3" />}
              Media attached
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <MediaPreview url={value} />
        </div>
      ) : (
        <div className="space-y-3">
          {showUrlInput ? (
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste media URL here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlSubmit()
                  }
                  if (e.key === 'Escape') {
                    setShowUrlInput(false)
                    setUrlInput("")
                  }
                }}
              />
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput("")
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUrlInput(true)}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Add URL
              </Button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}