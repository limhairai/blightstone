"use client"

import { Badge } from "../ui/badge"

export function EnvIndicator() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set'
  const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true'

  if (!isDebug) return null

  const getVariant = () => {
    switch (environment) {
      case 'development':
        return 'default'
      case 'staging':
        return 'secondary'
      case 'production':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <Badge variant={getVariant()} className="block">
        ENV: {environment.toUpperCase()}
      </Badge>
      <div className="text-xs text-muted-foreground bg-background/80 p-2 rounded border max-w-xs">
        <div className="font-mono text-xs">
          Supabase: {supabaseUrl.includes('127.0.0.1') ? 'LOCAL' : 'REMOTE'}
        </div>
        <div className="font-mono text-xs truncate">
          {supabaseUrl}
        </div>
      </div>
    </div>
  )
} 