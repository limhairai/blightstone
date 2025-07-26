"use client"

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoRefreshOptions {
  enabled?: boolean
  interval?: number // in milliseconds
  onRefresh: () => void | Promise<void>
  dependencies?: any[] // dependencies that should trigger a refresh
  pauseOnHidden?: boolean // pause when tab/window is hidden to save costs
  pauseOnOffline?: boolean // pause when offline
}

export function useAutoRefresh({
  enabled = true,
  interval = 300000, // 5 minutes default (cost-effective)
  onRefresh,
  dependencies = [],
  pauseOnHidden = true,
  pauseOnOffline = true
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  // ✅ FIXED: Use ref for onRefresh to avoid stale closures
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const startAutoRefresh = useCallback(() => {
    if (!enabled || intervalRef.current) return
    
    // Don't start if paused due to visibility or network conditions
    if ((pauseOnHidden && !isVisible) || (pauseOnOffline && !isOnline)) {
      return
    }

    intervalRef.current = setInterval(async () => {
      if (isRefreshingRef.current) return
      
      // Check conditions before each refresh to save costs
      if ((pauseOnHidden && !isVisible) || (pauseOnOffline && !isOnline)) {
        return
      }
      
      try {
        isRefreshingRef.current = true
        await onRefreshRef.current() // ✅ FIXED: Use ref to avoid stale closure
      } catch (error) {
        console.warn('Auto-refresh failed:', error)
      } finally {
        isRefreshingRef.current = false
      }
    }, interval)
  }, [enabled, interval, pauseOnHidden, pauseOnOffline, isVisible, isOnline]) // ✅ FIXED: Removed onRefresh from deps

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const manualRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    try {
      isRefreshingRef.current = true
      await onRefreshRef.current() // ✅ FIXED: Use ref to avoid stale closure
    } catch (error) {
      console.warn('Manual refresh failed:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, []) // ✅ FIXED: Empty deps since we use ref

  // Track page visibility to pause refresh when tab is hidden (saves costs)
  useEffect(() => {
    if (!pauseOnHidden) return

    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      
      if (visible) {
        // Resume refresh when tab becomes visible
        startAutoRefresh()
      } else {
        // Pause refresh when tab is hidden to save costs
        stopAutoRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseOnHidden, startAutoRefresh, stopAutoRefresh])

  // Track online status to pause refresh when offline
  useEffect(() => {
    if (!pauseOnOffline) return

    const handleOnline = () => {
      setIsOnline(true)
      startAutoRefresh()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      stopAutoRefresh()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pauseOnOffline, startAutoRefresh, stopAutoRefresh])

  // Start/stop auto-refresh based on enabled state
  useEffect(() => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return stopAutoRefresh
  }, [enabled, startAutoRefresh, stopAutoRefresh])

  // Restart auto-refresh when dependencies change (with stable comparison)
  const stableDependencies = useRef(dependencies)
  const dependenciesString = JSON.stringify(dependencies)
  
  useEffect(() => {
    // Only restart if dependencies actually changed (deep comparison)
    const currentDepsString = JSON.stringify(stableDependencies.current)
    if (currentDepsString !== dependenciesString) {
      stableDependencies.current = dependencies
      if (enabled) {
        stopAutoRefresh()
        startAutoRefresh()
      }
    }
  }, [enabled, dependenciesString, stopAutoRefresh, startAutoRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  return {
    manualRefresh,
    isRefreshing: isRefreshingRef.current,
    startAutoRefresh,
    stopAutoRefresh
  }
}

// Predefined intervals for common use cases
export const REFRESH_INTERVALS = {
  FAST: 60000,     // 1 minute - for critical data
  NORMAL: 300000,  // 5 minutes - for dashboard data  
  SLOW: 600000,    // 10 minutes - for less critical data
  VERY_SLOW: 1800000 // 30 minutes - for background data
} as const 