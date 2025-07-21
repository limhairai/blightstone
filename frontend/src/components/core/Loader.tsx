"use client"

import { useState, useEffect } from 'react'

interface LoaderProps {
  message?: string
  progressiveMessages?: string[]
  showProgress?: boolean
  phase?: 1 | 2
  className?: string
  fullScreen?: boolean // Legacy prop
}

export function Loader({ 
  message, 
  progressiveMessages, 
  showProgress = false, 
  phase = 1,
  className = "",
  fullScreen = false
}: LoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Default progressive messages for auth
  const defaultAuthMessages = [
    "Verifying your session...",
    "Loading your account...", 
    "Preparing your workspace...",
    "Almost ready..."
  ]

  const messages = progressiveMessages || (message ? [message] : defaultAuthMessages)

  useEffect(() => {
    if (!progressiveMessages && !showProgress) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1500) // Change message every 1.5 seconds

    return () => clearInterval(interval)
  }, [messages.length, progressiveMessages, showProgress])

  useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + Math.random() * 10
        }
        return prev
      })
    }, 200)

    return () => clearInterval(interval)
  }, [showProgress])

  // Legacy simple loader for backward compatibility
  if (fullScreen && !progressiveMessages && !showProgress) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Phase 1: Basic loader */}
      {phase === 1 && (
        <div className="relative">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Phase 2: Progress bar only */}
      {phase === 2 && showProgress && (
        <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 90)}%` }}
          />
        </div>
      )}

      {/* Progressive messages with simple transitions */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground font-medium transition-opacity duration-300">
          {messages[currentMessageIndex]}
        </p>
        {phase === 2 && showProgress && (
          <p className="text-xs text-muted-foreground/60">
            This should only take a moment...
          </p>
        )}
      </div>
    </div>
  )
} 