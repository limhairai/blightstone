"use client"

import React, { useState, useEffect } from "react"
import { File as FileIcon, Image, Video, FileText, Music, Archive } from "lucide-react"
import { filesApi } from "@/lib/api"

interface FileThumbnailProps {
  file: {
    id: string
    originalName: string
    filePath: string
    mimeType: string
    category: string
    fileSize: number
  }
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const FILE_ICONS = {
  image: Image,
  video: Video,
  document: FileText,
  audio: Music,
  archive: Archive,
  general: FileIcon
}

export function FileThumbnail({ file, size = 'md', onClick, className }: FileThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  // Check if file is an image that we can show as thumbnail
  const isImage = file.mimeType?.startsWith('image/') || file.category === 'image'
  const isVideo = file.mimeType?.startsWith('video/') || file.category === 'video'
  const isPDF = file.mimeType?.includes('pdf')
  
  // Check if we can show actual content preview
  const canShowPreview = isImage || isVideo || isPDF
  
  // Get appropriate icon based on file type
  const getFileIcon = () => {
    if (file.mimeType?.startsWith('image/')) return Image
    if (file.mimeType?.startsWith('video/')) return Video
    if (file.mimeType?.startsWith('audio/')) return Music
    if (file.mimeType?.includes('pdf') || file.mimeType?.includes('document')) return FileText
    if (file.mimeType?.includes('zip') || file.mimeType?.includes('archive')) return Archive
    
    // Fallback to category
    const Icon = FILE_ICONS[file.category as keyof typeof FILE_ICONS] || FileIcon
    return Icon
  }

  // Load thumbnail for previewable files
  const loadThumbnail = async () => {
    if (!canShowPreview || thumbnailUrl || thumbnailError || loading) return
    
    console.log('Loading thumbnail for:', file.originalName, 'Path:', file.filePath, 'MIME:', file.mimeType)
    setLoading(true)
    try {
      const signedUrl = await filesApi.getSignedUrl(file.filePath)
      console.log('Got signed URL:', signedUrl ? 'SUCCESS' : 'FAILED')
      if (signedUrl) {
        setThumbnailUrl(signedUrl)
      } else {
        setThumbnailError(true)
      }
    } catch (error) {
      console.error('Error loading thumbnail:', error)
      setThumbnailError(true)
    } finally {
      setLoading(false)
    }
  }

  // Don't auto-load thumbnails - only load on hover or click for performance
  // useEffect(() => {
  //   if (canShowPreview && !thumbnailUrl && !thumbnailError && !loading) {
  //     loadThumbnail()
  //   }
  // }, [canShowPreview, file.filePath])

  const Icon = getFileIcon()

  const baseClasses = `${sizeClasses[size]} rounded overflow-hidden border border-gray-200 ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''} ${className || ''}`

  // Render actual content preview for supported file types
  if (thumbnailUrl && !thumbnailError && isImage) {
    return (
      <div className={`${baseClasses} bg-gray-100`} onClick={onClick}>
        <img 
          src={thumbnailUrl} 
          alt={file.originalName}
          className="w-full h-full object-cover"
          onError={() => setThumbnailError(true)}
        />
      </div>
    )
  }

  // For non-images or failed images, show appropriate icon
  return (
    <div 
      className={`${baseClasses} bg-gray-50 flex items-center justify-center`}
      onClick={onClick}
    >
      {loading ? (
        <div className={`${iconSizes[size]} animate-pulse bg-gray-300 rounded`} />
      ) : (
        <Icon className={`${iconSizes[size]} text-gray-600`} />
      )}
    </div>
  )
}