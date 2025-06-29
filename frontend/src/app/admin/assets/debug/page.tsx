"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AssetsDebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/dolphin-assets/debug')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      setDebugData({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const runSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/dolphin-assets/sync', { method: 'POST' })
      const data = await response.json()
      setDebugData({ sync_result: data })
    } catch (error) {
      setDebugData({ sync_error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dolphin Assets Debug</h1>
      
      <div className="flex gap-4">
        <Button onClick={runDebug} disabled={loading}>
          {loading ? 'Loading...' : 'Debug All Assets'}
        </Button>
        <Button onClick={runSync} disabled={loading}>
          {loading ? 'Syncing...' : 'Run Sync'}
        </Button>
      </div>

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
