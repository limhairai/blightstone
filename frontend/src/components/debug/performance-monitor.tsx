"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { X, Activity } from 'lucide-react'

interface PerformanceData {
  navigationStart: number
  loadEventEnd: number
  domContentLoaded: number
  firstContentfulPaint?: number
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [apiCalls, setApiCalls] = useState<Array<{url: string, duration: number, timestamp: number}>>([])

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    // Collect performance data
    const collectPerformanceData = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        const data: PerformanceData = {
          navigationStart: navigation.navigationStart,
          loadEventEnd: navigation.loadEventEnd,
          domContentLoaded: navigation.domContentLoadedEventEnd,
        }

        // Try to get First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
        if (fcpEntry) {
          data.firstContentfulPaint = fcpEntry.startTime
        }

        setPerformanceData(data)
      }
    }

    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const response = await originalFetch(...args)
      const endTime = performance.now()
      
      setApiCalls(prev => [...prev, {
        url: args[0].toString(),
        duration: endTime - startTime,
        timestamp: Date.now()
      }].slice(-10)) // Keep only last 10 calls
      
      return response
    }

    // Collect data after page load
    if (document.readyState === 'complete') {
      collectPerformanceData()
    } else {
      window.addEventListener('load', collectPerformanceData)
    }

    return () => {
      window.fetch = originalFetch
      window.removeEventListener('load', collectPerformanceData)
    }
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    )
  }

  const getLoadTime = () => {
    if (!performanceData) return 'Loading...'
    const loadTime = performanceData.loadEventEnd - performanceData.navigationStart
    return `${Math.round(loadTime)}ms`
  }

  const getDOMTime = () => {
    if (!performanceData) return 'Loading...'
    const domTime = performanceData.domContentLoaded - performanceData.navigationStart
    return `${Math.round(domTime)}ms`
  }

  const getFCPTime = () => {
    if (!performanceData?.firstContentfulPaint) return 'N/A'
    return `${Math.round(performanceData.firstContentfulPaint)}ms`
  }

  const getAverageApiTime = () => {
    if (apiCalls.length === 0) return 'N/A'
    const avg = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
    return `${Math.round(avg)}ms`
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Performance Monitor</h3>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Page Load:</span>
            <Badge variant={parseInt(getLoadTime()) > 3000 ? 'destructive' : 'secondary'}>
              {getLoadTime()}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>DOM Ready:</span>
            <Badge variant={parseInt(getDOMTime()) > 2000 ? 'destructive' : 'secondary'}>
              {getDOMTime()}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>First Paint:</span>
            <Badge variant="outline">{getFCPTime()}</Badge>
          </div>
          
          <div className="flex justify-between">
            <span>Avg API:</span>
            <Badge variant={parseInt(getAverageApiTime()) > 1000 ? 'destructive' : 'secondary'}>
              {getAverageApiTime()}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>API Calls:</span>
            <Badge variant="outline">{apiCalls.length}</Badge>
          </div>
        </div>

        {apiCalls.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <h4 className="text-xs font-medium mb-1">Recent API Calls:</h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {apiCalls.slice(-5).map((call, i) => (
                <div key={i} className="text-xs flex justify-between">
                  <span className="truncate flex-1 mr-2">
                    {call.url.split('/').pop()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(call.duration)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 