// Database Optimization Utilities
// Provides connection pooling, query optimization, and performance monitoring

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface QueryPerformanceMetrics {
  query: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
}

interface ConnectionPoolConfig {
  maxConnections: number
  minConnections: number
  acquireTimeout: number
  idleTimeout: number
  reapInterval: number
}

class DatabaseOptimizer {
  private client: SupabaseClient
  private queryMetrics: QueryPerformanceMetrics[] = []
  private connectionPool: Map<string, SupabaseClient> = new Map()
  private poolConfig: ConnectionPoolConfig
  private activeConnections = 0
  private waitingQueue: Array<{
    resolve: (client: SupabaseClient) => void
    reject: (error: Error) => void
  }> = []

  constructor() {
    this.poolConfig = {
      maxConnections: 10,
      minConnections: 2,
      acquireTimeout: 30000, // 30 seconds
      idleTimeout: 300000,   // 5 minutes
      reapInterval: 60000    // 1 minute
    }

    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'adhub-optimized',
          },
        },
      }
    )

    this.initializePool()
    this.startReaper()
  }

  private initializePool() {
    // Create minimum connections
    for (let i = 0; i < this.poolConfig.minConnections; i++) {
      this.createConnection()
    }
  }

  private createConnection(): SupabaseClient {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          persistSession: false, // Pool connections don't need persistent sessions
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'X-Connection-ID': connectionId,
            'X-Client-Info': 'adhub-pool',
          },
        },
      }
    )

    this.connectionPool.set(connectionId, client)
    this.activeConnections++

    return client
  }

  private async acquireConnection(): Promise<SupabaseClient> {
    // If we have available connections, use them
    if (this.activeConnections < this.poolConfig.maxConnections) {
      return this.createConnection()
    }

    // If pool is full, wait for a connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection pool timeout'))
      }, this.poolConfig.acquireTimeout)

      this.waitingQueue.push({
        resolve: (client) => {
          clearTimeout(timeout)
          resolve(client)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
  }

  private releaseConnection(client: SupabaseClient) {
    // If there are waiting requests, fulfill them
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()!
      waiting.resolve(client)
      return
    }

    // Otherwise, keep connection in pool for reuse
    // Note: In a real implementation, you'd track connection usage and idle time
  }

  private startReaper() {
    setInterval(() => {
      this.reapIdleConnections()
      this.cleanupMetrics()
    }, this.poolConfig.reapInterval)
  }

  private reapIdleConnections() {
    // In a real implementation, you'd track connection last used time
    // and close connections that have been idle too long
    
    // For now, we'll just ensure we don't exceed max connections
    if (this.activeConnections > this.poolConfig.maxConnections) {
      const excess = this.activeConnections - this.poolConfig.maxConnections
      let removed = 0
      
      for (const [connectionId, client] of this.connectionPool.entries()) {
        if (removed >= excess) break
        
        this.connectionPool.delete(connectionId)
        this.activeConnections--
        removed++
      }
    }
  }

  private cleanupMetrics() {
    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000)
    }
  }

  // Optimized query execution with performance tracking
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>,
    queryName: string = 'unnamed'
  ): Promise<T> {
    const startTime = performance.now()
    const client = await this.acquireConnection()
    
    try {
      const result = await queryFn(client)
      const duration = performance.now() - startTime
      
      this.recordMetric({
        query: queryName,
        duration,
        timestamp: Date.now(),
        success: true
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric({
        query: queryName,
        duration,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    } finally {
      this.releaseConnection(client)
    }
  }

  private recordMetric(metric: QueryPerformanceMetrics) {
    this.queryMetrics.push(metric)
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      console.warn(`🐌 Slow query detected: ${metric.query} took ${metric.duration.toFixed(2)}ms`)
    }
  }

  // Optimized batch operations
  async executeBatch<T>(
    operations: Array<{
      queryFn: (client: SupabaseClient) => Promise<T>
      name: string
    }>
  ): Promise<T[]> {
    const startTime = performance.now()
    
    try {
      // Execute all operations in parallel using available connections
      const results = await Promise.all(
        operations.map(async (op) => {
          return this.executeQuery(op.queryFn, op.name)
        })
      )
      
      const totalDuration = performance.now() - startTime
      
      this.recordMetric({
        query: `batch_${operations.length}_operations`,
        duration: totalDuration,
        timestamp: Date.now(),
        success: true
      })
      
      return results
    } catch (error) {
      const totalDuration = performance.now() - startTime
      
      this.recordMetric({
        query: `batch_${operations.length}_operations`,
        duration: totalDuration,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  }

  // Common optimized queries
  async getOrganizationDashboard(orgId: string) {
    return this.executeQuery(
      async (client) => {
        // Use the optimized database function we created
        const { data, error } = await client.rpc('get_organization_dashboard_data', {
          org_id: orgId
        })
        
        if (error) throw error
        return data
      },
      'get_organization_dashboard'
    )
  }

  async getOrganizationWithAssets(orgId: string) {
    return this.executeQuery(
      async (client) => {
        const { data, error } = await client
          .from('organizations')
          .select(`
            *,
            wallets(*),
            application(
              *,
              profiles:approved_by(name),
              profiles:rejected_by(name),
              profiles:fulfilled_by(name)
            ),
            support_tickets(*)
          `)
          .eq('organization_id', orgId)
          .single()
        
        if (error) throw error
        return data
      },
      'get_organization_with_assets'
    )
  }

  async getTransactionHistory(orgId: string, limit: number = 50) {
    return this.executeQuery(
      async (client) => {
        const { data, error } = await client
          .from('transactions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (error) throw error
        return data
      },
      'get_transaction_history'
    )
  }

  // Performance monitoring and insights
  getPerformanceMetrics() {
    const recentMetrics = this.queryMetrics.slice(-100)
    
    if (recentMetrics.length === 0) {
      return {
        avgQueryTime: 0,
        slowQueries: [],
        errorRate: 0,
        totalQueries: 0
      }
    }
    
    const avgQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    const slowQueries = recentMetrics.filter(m => m.duration > 1000)
    const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length
    
    return {
      avgQueryTime: Math.round(avgQueryTime),
      slowQueries: slowQueries.slice(0, 10),
      errorRate: Math.round(errorRate * 100),
      totalQueries: recentMetrics.length,
      connectionPoolStats: {
        activeConnections: this.activeConnections,
        maxConnections: this.poolConfig.maxConnections,
        waitingQueue: this.waitingQueue.length
      }
    }
  }

  // Query optimization helpers
  optimizeQuery(baseQuery: any) {
    // Add common optimizations
    return baseQuery
      .limit(1000) // Prevent accidentally large queries
      .order('created_at', { ascending: false }) // Most recent first
  }

  // Cleanup method
  async cleanup() {
    // Clear waiting queue
    this.waitingQueue.forEach(waiting => {
      waiting.reject(new Error('Database optimizer shutting down'))
    })
    this.waitingQueue = []
    
    // Clear metrics
    this.queryMetrics = []
    
    // Close all connections
    this.connectionPool.clear()
    this.activeConnections = 0
  }
}

// Export singleton instance
export const dbOptimizer = new DatabaseOptimizer()

// React hook for using optimized database queries
export function useOptimizedQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<T>,
  queryName: string,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    let cancelled = false
    
    const executeQuery = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await dbOptimizer.executeQuery(queryFn, queryName)
        
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    executeQuery()
    
    return () => {
      cancelled = true
    }
  }, dependencies)
  
  return { data, loading, error }
}

// Import React for the hook
import React from 'react' 