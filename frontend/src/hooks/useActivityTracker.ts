import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseActivityTrackerOptions {
  /**
   * Interval in milliseconds to update activity (default: 5 minutes)
   */
  updateInterval?: number
  /**
   * Whether to track activity (default: true)
   */
  enabled?: boolean
}

/**
 * Hook to track user activity and update last_active timestamp
 */
export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const { 
    updateInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true 
  } = options
  
  const { user, session } = useAuth()
  const lastUpdateRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const updateActivity = async () => {
    if (!user || !session || !enabled) return

    const now = Date.now()
    // Only update if it's been at least the update interval since last update
    if (now - lastUpdateRef.current < updateInterval) return

    try {
      await fetch('/api/auth/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      lastUpdateRef.current = now
    } catch (error) {
      console.error('Failed to update user activity:', error)
    }
  }

  const scheduleNextUpdate = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      updateActivity()
      scheduleNextUpdate()
    }, updateInterval)
  }

  useEffect(() => {
    if (!enabled || !user || !session) return

    // Update activity immediately when user is authenticated
    updateActivity()
    
    // Schedule periodic updates
    scheduleNextUpdate()

    // Track user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const handleUserActivity = () => {
      updateActivity()
    }

    // Add throttling to prevent too frequent updates
    let throttleTimeout: NodeJS.Timeout
    const throttledHandler = () => {
      if (throttleTimeout) return
      
      throttleTimeout = setTimeout(() => {
        handleUserActivity()
        clearTimeout(throttleTimeout)
      }, 60000) // Throttle to once per minute
    }

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true })
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler)
      })
    }
  }, [user, session, enabled, updateInterval])

  return {
    updateActivity: () => updateActivity()
  }
}