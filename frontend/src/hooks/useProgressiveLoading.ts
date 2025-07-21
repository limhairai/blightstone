import { useState, useEffect, useCallback } from 'react'

interface ProgressiveLoadingOptions {
  phase1Duration?: number // How long to show phase 1 (default 800ms)
  enablePhase2?: boolean // Whether to use phase 2 at all
  minLoadingTime?: number // Minimum total loading time
}

interface ProgressiveLoadingState {
  phase: 1 | 2
  isLoading: boolean
  progress: number
}

export function useProgressiveLoading(
  actuallyLoading: boolean,
  options: ProgressiveLoadingOptions = {}
) {
  const {
    phase1Duration = 800,
    enablePhase2 = true,
    minLoadingTime = 1200
  } = options

  const [state, setState] = useState<ProgressiveLoadingState>({
    phase: 1,
    isLoading: true,
    progress: 0
  })

  const [startTime] = useState(() => Date.now())

  useEffect(() => {
    if (!actuallyLoading) {
      // Data has loaded, but respect minimum loading time for UX
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsed)
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          progress: 100
        }))
      }, remainingTime)
      return
    }

    // Manage phase transitions while still loading
    if (enablePhase2) {
      const phase1Timer = setTimeout(() => {
        setState(prev => ({ ...prev, phase: 2 }))
      }, phase1Duration)

      return () => clearTimeout(phase1Timer)
    }
  }, [actuallyLoading, phase1Duration, enablePhase2, minLoadingTime, startTime])

  // Simulate progress for better UX
  useEffect(() => {
    if (!state.isLoading) return

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.progress >= 90) return prev // Cap at 90% until actually done
        
        const increment = state.phase === 1 ? 15 : 8 // Faster progress in phase 1
        return {
          ...prev,
          progress: Math.min(prev.progress + increment + Math.random() * 5, 90)
        }
      })
    }, 300)

    return () => clearInterval(interval)
  }, [state.isLoading, state.phase])

  const reset = useCallback(() => {
    setState({
      phase: 1,
      isLoading: true,
      progress: 0
    })
  }, [])

  return {
    ...state,
    reset
  }
}

// Specialized hooks for common use cases
export function useAuthLoading(actuallyLoading: boolean) {
  return useProgressiveLoading(actuallyLoading, {
    phase1Duration: 600,
    enablePhase2: true,
    minLoadingTime: 1000
  })
}

export function useDashboardLoading(actuallyLoading: boolean) {
  return useProgressiveLoading(actuallyLoading, {
    phase1Duration: 500,
    enablePhase2: true,
    minLoadingTime: 800
  })
}

export function useAdminLoading(actuallyLoading: boolean) {
  return useProgressiveLoading(actuallyLoading, {
    phase1Duration: 700,
    enablePhase2: true,
    minLoadingTime: 1200
  })
} 