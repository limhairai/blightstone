"use client"

// Admin Performance Optimization System
// Makes every admin interaction feel like 0ms delay

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'

// Admin-specific performance optimizations
export class AdminPerformanceOptimizer {
  private static instance: AdminPerformanceOptimizer
  private adminDataCache = new Map<string, any>()
  private prefetchedRoutes = new Set<string>()
  private optimisticUpdates = new Map<string, any>()

  static getInstance(): AdminPerformanceOptimizer {
    if (!AdminPerformanceOptimizer.instance) {
      AdminPerformanceOptimizer.instance = new AdminPerformanceOptimizer()
    }
    return AdminPerformanceOptimizer.instance
  }

  // Preload all admin routes for instant navigation
  preloadAdminRoutes(): void {
    const adminRoutes = [
      '/admin',
      '/admin/applications',
      '/admin/support',
      '/admin/assets',
      '/admin/transactions/history',
      '/admin/teams',
      '/admin/settings'
    ]

    adminRoutes.forEach(route => {
      if (!this.prefetchedRoutes.has(route)) {
        // Prefetch route
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = route
        document.head.appendChild(link)
        this.prefetchedRoutes.add(route)
      }
    })
  }

  // Cache admin data aggressively
  cacheAdminData(key: string, data: any): void {
    this.adminDataCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 30000 // 30 seconds TTL for admin data
    })
  }

  getCachedAdminData(key: string): any | null {
    const cached = this.adminDataCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    return null
  }

  // Optimistic updates for admin actions
  applyOptimisticUpdate(key: string, update: any): () => void {
    this.optimisticUpdates.set(key, update)
    return () => this.optimisticUpdates.delete(key)
  }

  getOptimisticUpdate(key: string): any | null {
    return this.optimisticUpdates.get(key) || null
  }
}

// Hook for admin performance optimizations
export const useAdminPerformance = () => {
  const optimizer = AdminPerformanceOptimizer.getInstance()
  const { mutate } = useSWRConfig()
  const router = useRouter()

  useEffect(() => {
    // Preload all admin routes on mount
    optimizer.preloadAdminRoutes()
  }, [])

  // Instant admin navigation
  const navigateToAdmin = useCallback((route: string) => {
    // Navigate instantly without visual feedback
    router.push(route)
  }, [router])

  // Instant admin data updates
  const updateAdminDataOptimistically = useCallback(async (
    key: string, 
    optimisticData: any, 
    serverUpdate: () => Promise<any>
  ) => {
    // 1. Immediately update UI
    mutate(key, optimisticData, false)
    
    try {
      // 2. Update server in background
      const serverData = await serverUpdate()
      
      // 3. Sync with server response
      mutate(key, serverData, false)
      
      return serverData
    } catch (error) {
      // 4. Revert on error
      mutate(key, undefined, true)
      throw error
    }
  }, [mutate])

  // Instant admin actions
  const performInstantAdminAction = useCallback(async (
    action: string,
    operation: () => Promise<any>,
    optimisticUpdate?: any
  ) => {
    const startTime = performance.now()
    
    // Show instant feedback
    const feedback = document.createElement('div')
    feedback.className = 'admin-action-feedback'
    feedback.textContent = `${action}...`
    document.body.appendChild(feedback)
    
    try {
      // Apply optimistic update if provided
      if (optimisticUpdate) {
        mutate(optimisticUpdate.key, optimisticUpdate.data, false)
      }
      
      // Perform operation
      const result = await operation()
      
      // Show success feedback
      feedback.textContent = `${action} completed!`
      feedback.classList.add('success')
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 2000)
      
      return result
    } catch (error) {
      // Show error feedback
      feedback.textContent = `${action} failed!`
      feedback.classList.add('error')
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 3000)
      
      throw error
    } finally {
      const duration = performance.now() - startTime
      if (duration > 100) {
        console.warn(`Slow admin action: ${action} took ${duration.toFixed(2)}ms`)
      }
    }
  }, [mutate])

  return {
    navigateToAdmin,
    updateAdminDataOptimistically,
    performInstantAdminAction,
    cacheAdminData: optimizer.cacheAdminData.bind(optimizer),
    getCachedAdminData: optimizer.getCachedAdminData.bind(optimizer)
  }
}

// Instant admin table interactions
export const useInstantAdminTable = () => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filterConfig, setFilterConfig] = useState<Record<string, any>>({})

  // Instant row selection
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Instant bulk actions
  const performBulkAction = useCallback(async (
    action: string,
    operation: (ids: string[]) => Promise<any>
  ) => {
    const ids = Array.from(selectedRows)
    if (ids.length === 0) return

    // Show instant feedback
    const feedback = document.createElement('div')
    feedback.className = 'bulk-action-feedback'
    feedback.textContent = `${action} ${ids.length} items...`
    document.body.appendChild(feedback)

    try {
      const result = await operation(ids)
      
      feedback.textContent = `${action} completed for ${ids.length} items!`
      feedback.classList.add('success')
      
      // Clear selection
      setSelectedRows(new Set())
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 2000)
      
      return result
    } catch (error) {
      feedback.textContent = `${action} failed!`
      feedback.classList.add('error')
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 3000)
      
      throw error
    }
  }, [selectedRows])

  // Instant sorting
  const sortTable = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }, [])

  // Instant filtering
  const filterTable = useCallback((key: string, value: any) => {
    setFilterConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  return {
    selectedRows,
    sortConfig,
    filterConfig,
    toggleRowSelection,
    performBulkAction,
    sortTable,
    filterTable,
    clearSelection: () => setSelectedRows(new Set())
  }
}

// Instant admin forms
export const useInstantAdminForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Instant form submission
  const submitFormInstantly = useCallback(async (
    formData: FormData | Record<string, any>,
    endpoint: string
  ) => {
    setIsSubmitting(true)
    
    // Show instant feedback
    const feedback = document.createElement('div')
    feedback.className = 'form-submission-feedback'
    feedback.textContent = 'Submitting...'
    document.body.appendChild(feedback)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Form submission failed')
      }

      const result = await response.json()
      
      feedback.textContent = 'Submitted successfully!'
      feedback.classList.add('success')
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 2000)
      
      return result
    } catch (error) {
      feedback.textContent = 'Submission failed!'
      feedback.classList.add('error')
      
      setTimeout(() => {
        document.body.removeChild(feedback)
      }, 3000)
      
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    isSubmitting,
    submitFormInstantly,
    formRef
  }
}

// Initialize admin performance optimizations
export const initializeAdminPerformance = () => {
  // Add admin-specific CSS for instant feedback
  const style = document.createElement('style')
  style.textContent = `
    .admin-action-feedback {
      position: fixed;
      top: 20px;
      right: 20px;
      background: hsl(var(--background));
      border: 1px solid hsl(var(--border));
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.2s ease-out;
    }

    .admin-action-feedback.success {
      border-color: hsl(var(--success));
      color: hsl(var(--success));
    }

    .admin-action-feedback.error {
      border-color: hsl(var(--destructive));
      color: hsl(var(--destructive));
    }

    .bulk-action-feedback {
      position: fixed;
      top: 80px;
      right: 20px;
      background: hsl(var(--background));
      border: 1px solid hsl(var(--border));
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.2s ease-out;
    }

    .form-submission-feedback {
      position: fixed;
      top: 140px;
      right: 20px;
      background: hsl(var(--background));
      border: 1px solid hsl(var(--border));
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.2s ease-out;
    }

    .admin-nav-active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }

    .admin-table-row {
      transition: background-color 0.1s ease;
    }

    .admin-table-row:hover {
      background-color: hsl(var(--muted));
    }

    .admin-table-row.selected {
      background-color: hsl(var(--primary) / 0.1);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Instant admin button feedback */
    .admin-button-instant {
      transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .admin-button-instant:active {
      transform: scale(0.98);
    }

    /* Instant admin form feedback */
    .admin-form-instant {
      transition: all 0.1s ease;
    }

    .admin-form-instant:focus-within {
      transform: translateZ(0);
    }
  `
  document.head.appendChild(style)
}

// Export for easy access
export default AdminPerformanceOptimizer 