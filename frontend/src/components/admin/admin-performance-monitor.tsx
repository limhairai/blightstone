import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Activity, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceMetrics {
  pageLoadTime: number
  interactionDelay: number
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
  errors: number
  warnings: number
}

interface AdminPerformanceMonitorProps {
  className?: string
}

export function AdminPerformanceMonitor({ className }: AdminPerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    interactionDelay: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    errors: 0,
    warnings: 0
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const [history, setHistory] = useState<PerformanceMetrics[]>([])

  // Measure page load time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadTime = performance.now()
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
      
      // Add to history
      setHistory(prev => [...prev.slice(-9), { ...metrics, pageLoadTime: loadTime }])
    }
  }, [])

  // Monitor memory usage
  useEffect(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        setMetrics(prev => ({ ...prev, memoryUsage: usage }))
      }
      
      updateMemoryUsage()
      const interval = setInterval(updateMemoryUsage, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  // ✅ FIXED: Use refs at component level to avoid stale closures
  const errorsRef = useRef(0)
  const warningsRef = useRef(0)

  // ✅ FIXED: Monitor errors and warnings without memory leaks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalError = console.error
      const originalWarn = console.warn
      
      console.error = (...args) => {
        errorsRef.current++
        setMetrics(prev => ({ ...prev, errors: errorsRef.current }))
        originalError.apply(console, args)
      }
      
      console.warn = (...args) => {
        warningsRef.current++
        setMetrics(prev => ({ ...prev, warnings: warningsRef.current }))
        originalWarn.apply(console, args)
      }
      
      return () => {
        console.error = originalError
        console.warn = originalWarn
      }
    }
  }, []) // ✅ Empty deps is correct here since we use refs

  // Measure interaction delay
  const measureInteraction = useCallback(() => {
    const start = performance.now()
    return () => {
      const delay = performance.now() - start
      setMetrics(prev => ({ ...prev, interactionDelay: delay }))
      
      // Log slow interactions
      if (delay > 100) {
        console.warn(`Slow interaction detected: ${delay.toFixed(2)}ms`)
      }
    }
  }, [])

  // Get performance status
  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      pageLoadTime: { good: 1000, warning: 2000 },
      interactionDelay: { good: 50, warning: 100 },
      memoryUsage: { good: 50, warning: 80 },
      networkLatency: { good: 100, warning: 300 }
    }
    
    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'unknown'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'warning'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'poor': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={cn('fixed bottom-4 right-4 z-50', className)}
      >
        <Zap className="h-4 w-4 mr-2" />
        Performance
      </Button>
    )
  }

  return (
    <Card className={cn('fixed bottom-4 right-4 w-80 z-50 shadow-lg', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Page Load Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page Load</span>
            <div className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(getPerformanceStatus('pageLoadTime', metrics.pageLoadTime)))} />
              <span className="text-xs font-mono">{metrics.pageLoadTime.toFixed(0)}ms</span>
            </div>
          </div>
          <Progress 
            value={Math.min((metrics.pageLoadTime / 3000) * 100, 100)} 
            className="h-1"
          />
        </div>

        {/* Interaction Delay */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Interaction Delay</span>
            <div className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(getPerformanceStatus('interactionDelay', metrics.interactionDelay)))} />
              <span className="text-xs font-mono">{metrics.interactionDelay.toFixed(1)}ms</span>
            </div>
          </div>
          <Progress 
            value={Math.min((metrics.interactionDelay / 200) * 100, 100)} 
            className="h-1"
          />
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Memory Usage</span>
              <div className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', getStatusColor(getPerformanceStatus('memoryUsage', metrics.memoryUsage)))} />
                <span className="text-xs font-mono">{metrics.memoryUsage.toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={metrics.memoryUsage} className="h-1" />
          </div>
        )}

        {/* Errors and Warnings */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {metrics.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {metrics.errors} Errors
              </Badge>
            )}
            {metrics.warnings > 0 && (
              <Badge variant="secondary" className="text-xs">
                {metrics.warnings} Warnings
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMetrics(prev => ({ ...prev, errors: 0, warnings: 0 }))
            }}
            className="h-6 text-xs"
          >
            Clear
          </Button>
        </div>

        {/* Performance Tips */}
        {metrics.pageLoadTime > 2000 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 Consider optimizing page load time for better user experience
          </div>
        )}
        
        {metrics.interactionDelay > 100 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 Interaction delay is high. Check for blocking operations
          </div>
        )}
        
        {metrics.memoryUsage > 80 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 High memory usage detected. Consider memory optimization
          </div>
        )}
      </CardContent>
    </Card>
  )
} 