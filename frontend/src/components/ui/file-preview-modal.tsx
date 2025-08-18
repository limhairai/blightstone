"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { filesApi } from "@/lib/api"

interface FilePreviewModalProps {
  file: {
    id: string
    originalName: string
    filePath: string
    fileSize: number
    mimeType: string
    category: string
    description?: string
    createdAt: string
  } | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (file: any) => void
  onDelete?: (file: any) => void
  onDownload?: (file: any) => void
  files?: any[]
  currentIndex?: number
  onNavigate?: (direction: 'prev' | 'next') => void
}

export function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  files,
  currentIndex,
  onNavigate
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Load preview URL when file changes
  useEffect(() => {
    if (file && isOpen) {
      loadPreview()
    } else {
      setPreviewUrl(null)
      setError(false)
    }
  }, [file, isOpen])

  const loadPreview = async () => {
    if (!file) return
    
    console.log('Loading preview for file:', {
      name: file.originalName,
      path: file.filePath,
      mimeType: file.mimeType,
      id: file.id
    })
    
    setLoading(true)
    setError(false)
    
    try {
      const signedUrl = await filesApi.getSignedUrl(file.filePath)
      console.log('Preview signed URL result:', signedUrl ? 'SUCCESS' : 'FAILED', signedUrl)
      
      if (signedUrl) {
        setPreviewUrl(signedUrl)
      } else {
        console.error('No signed URL returned for file:', file.filePath)
        setError(true)
      }
    } catch (err) {
      console.error('Error loading preview:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canNavigate = files && files.length > 1
  const canGoNext = canNavigate && currentIndex !== undefined && currentIndex < files.length - 1
  const canGoPrev = canNavigate && currentIndex !== undefined && currentIndex > 0

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading preview...</p>
          </div>
        </div>
      )
    }

    if (error || !previewUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-500">Preview not available</p>
            <p className="text-sm text-gray-400 mt-2">File: {file?.originalName}</p>
            <p className="text-sm text-gray-400">Type: {file?.mimeType}</p>
            <p className="text-sm text-gray-400 mt-2">Click download to view this file</p>
          </div>
        </div>
      )
    }

    if (file?.mimeType?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4" style={{ minHeight: '400px', maxHeight: '70vh' }}>
          <img
            src={previewUrl}
            alt={file.originalName}
            className="max-w-full max-h-full object-contain rounded shadow-sm"
            style={{ maxWidth: '100%', height: 'auto' }}
            onError={(e) => {
              console.error('Image load error:', e)
              console.error('Failed image URL:', previewUrl)
              setError(true)
            }}
            onLoad={() => console.log('Image loaded successfully:', previewUrl)}
          />
        </div>
      )
    }

    if (file?.mimeType?.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4" style={{ minHeight: '400px', maxHeight: '70vh' }}>
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-full rounded shadow-sm"
            style={{ maxWidth: '100%', height: 'auto' }}
            onError={() => setError(true)}
          >
            Your browser does not support video playback.
          </video>
        </div>
      )
    }

    if (file?.mimeType?.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <audio
              src={previewUrl}
              controls
              className="mb-4"
              onError={() => setError(true)}
            >
              Your browser does not support audio playback.
            </audio>
            <p className="text-gray-600">{file.originalName}</p>
          </div>
        </div>
      )
    }

    if (file?.mimeType?.includes('pdf')) {
      return (
        <div className="h-96 bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title={file.originalName}
            onError={() => setError(true)}
          />
        </div>
      )
    }

    if (file?.mimeType?.startsWith('text/') || file?.mimeType?.includes('json') || file?.mimeType?.includes('xml')) {
      return (
        <div className="h-96 bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title={file.originalName}
            onError={() => setError(true)}
          />
        </div>
      )
    }

    // Fallback for unsupported file types
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-500">Preview not available for this file type</p>
          <p className="text-sm text-gray-400 mt-2">{file?.mimeType}</p>
        </div>
      </div>
    )
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1 min-w-0 pr-4">
            <DialogTitle className="text-lg font-medium break-all leading-tight">
              {file.originalName}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
              <span>{formatFileSize(file.fileSize)}</span>
              <span>{formatDate(file.createdAt)}</span>
              <span className="capitalize">{file.category}</span>
            </div>
          </div>
          
          {/* Navigation arrows */}
          {canNavigate && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.('prev')}
                disabled={!canGoPrev}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500 px-2">
                {currentIndex !== undefined ? currentIndex + 1 : 1} of {files?.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.('next')}
                disabled={!canGoNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="w-full">
            {renderPreview()}
          </div>
          
          {file.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{file.description}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {file.mimeType}
          </div>
          
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(file)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(file)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}