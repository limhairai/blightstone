// Optimized Query Functions
// Pre-built optimized queries for common operations

import { dbOptimizer } from './database-optimization'
import { SupabaseClient } from '@supabase/supabase-js'

// Organization queries
export const organizationQueries = {
  // Get organization dashboard data (uses optimized database function)
  getDashboard: async (orgId: string) => {
    return dbOptimizer.getOrganizationDashboard(orgId)
  },

  // Get organization with all related data
  getWithAssets: async (orgId: string) => {
    return dbOptimizer.getOrganizationWithAssets(orgId)
  },

  // Get organization balance and wallet info
  getFinancialSummary: async (orgId: string) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        const { data, error } = await client
          .from('wallets')
          .select(`
            balance_cents,
            reserved_balance_cents,
            transactions:transactions(
              amount_cents,
              type,
              created_at
            )
          `)
          .eq('organization_id', orgId)
          .single()
        
        if (error) throw error
        return data
      },
      'get_financial_summary'
    )
  }
}

// Application queries
export const applicationQueries = {
  // Get applications with admin details
  getWithAdminDetails: async (orgId?: string) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        let query = client
          .from('application')
          .select(`
            *,
            organization:organizations(name),
            approved_by_profile:profiles!approved_by(name),
            rejected_by_profile:profiles!rejected_by(name),
            fulfilled_by_profile:profiles!fulfilled_by(name)
          `)
          .order('created_at', { ascending: false })
        
        if (orgId) {
          query = query.eq('organization_id', orgId)
        }
        
        const { data, error } = await query
        if (error) throw error
        return data
      },
      'get_applications_with_admin_details'
    )
  },

  // Get pending applications count
  getPendingCount: async (orgId?: string) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        let query = client
          .from('application')
          .select('application_id', { count: 'exact' })
          .eq('status', 'pending')
        
        if (orgId) {
          query = query.eq('organization_id', orgId)
        }
        
        const { count, error } = await query
        if (error) throw error
        return count || 0
      },
      'get_pending_applications_count'
    )
  }
}

// Transaction queries
export const transactionQueries = {
  // Get transaction history with pagination
  getHistory: async (orgId: string, page: number = 1, limit: number = 50) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        const offset = (page - 1) * limit
        
        const { data, error, count } = await client
          .from('transactions')
          .select('*', { count: 'exact' })
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (error) throw error
        return {
          transactions: data,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          currentPage: page
        }
      },
      'get_transaction_history_paginated'
    )
  },

  // Get transaction summary
  getSummary: async (orgId: string, days: number = 30) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        
        const { data, error } = await client
          .from('transactions')
          .select('type, amount_cents, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', startDate.toISOString())
        
        if (error) throw error
        
        // Calculate summary
        const summary = data.reduce((acc, tx) => {
          const type = tx.type
          acc[type] = (acc[type] || 0) + tx.amount_cents
          return acc
        }, {} as Record<string, number>)
        
        return {
          summary,
          totalTransactions: data.length,
          periodDays: days
        }
      },
      'get_transaction_summary'
    )
  }
}

// Support ticket queries
export const supportQueries = {
  // Get tickets with assignee details
  getWithAssignees: async (orgId?: string) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        let query = client
          .from('support_tickets')
          .select(`
            *,
            created_by_profile:profiles!created_by(name, email),
            assigned_to_profile:profiles!assigned_to(name, email),
            organization:organizations(name)
          `)
          .order('created_at', { ascending: false })
        
        if (orgId) {
          query = query.eq('organization_id', orgId)
        }
        
        const { data, error } = await query
        if (error) throw error
        return data
      },
      'get_support_tickets_with_assignees'
    )
  },

  // Get ticket statistics
  getStats: async (orgId?: string) => {
    return dbOptimizer.executeQuery(
      async (client: SupabaseClient) => {
        let query = client
          .from('support_tickets')
          .select('status, category, created_at')
        
        if (orgId) {
          query = query.eq('organization_id', orgId)
        }
        
        const { data, error } = await query
        if (error) throw error
        
        // Calculate statistics
        const stats = data.reduce((acc, ticket) => {
          acc.total++
          acc.byStatus[ticket.status] = (acc.byStatus[ticket.status] || 0) + 1
          acc.byCategory[ticket.category] = (acc.byCategory[ticket.category] || 0) + 1
          return acc
        }, {
          total: 0,
          byStatus: {} as Record<string, number>,
          byCategory: {} as Record<string, number>
        })
        
        return stats
      },
      'get_support_ticket_stats'
    )
  }
}

// Batch operations for dashboard
export const dashboardQueries = {
  // Get complete dashboard data in one batch
  getCompleteDashboard: async (orgId: string) => {
    return dbOptimizer.executeBatch([
      {
        queryFn: (client: SupabaseClient) => organizationQueries.getDashboard(orgId),
        name: 'dashboard_organization'
      },
      {
        queryFn: (client: SupabaseClient) => applicationQueries.getPendingCount(orgId),
        name: 'dashboard_pending_apps'
      },
      {
        queryFn: (client: SupabaseClient) => transactionQueries.getHistory(orgId, 1, 10),
        name: 'dashboard_recent_transactions'
      },
      {
        queryFn: (client: SupabaseClient) => supportQueries.getStats(orgId),
        name: 'dashboard_support_stats'
      }
    ])
  }
}

// Admin queries
export const adminQueries = {
  // Get admin overview data
  getOverview: async () => {
    return dbOptimizer.executeBatch([
      {
        queryFn: async (client: SupabaseClient) => {
          const { count, error } = await client
            .from('organizations')
            .select('organization_id', { count: 'exact' })
          if (error) throw error
          return count || 0
        },
        name: 'admin_total_organizations'
      },
      {
        queryFn: async (client: SupabaseClient) => {
          const { count, error } = await client
            .from('application')
            .select('application_id', { count: 'exact' })
            .eq('status', 'pending')
          if (error) throw error
          return count || 0
        },
        name: 'admin_pending_applications'
      },
      {
        queryFn: async (client: SupabaseClient) => {
          const { count, error } = await client
            .from('support_tickets')
            .select('ticket_id', { count: 'exact' })
            .eq('status', 'open')
          if (error) throw error
          return count || 0
        },
        name: 'admin_open_tickets'
      }
    ])
  }
}

// Performance monitoring
export const performanceQueries = {
  // Get database performance metrics
  getMetrics: () => {
    return dbOptimizer.getPerformanceMetrics()
  },

  // Test database performance
  runPerformanceTest: async () => {
    const testQueries = [
      {
        queryFn: async (client: SupabaseClient) => {
          const { data, error } = await client
            .from('organizations')
            .select('organization_id')
            .limit(1)
          if (error) throw error
          return data
        },
        name: 'perf_test_simple_select'
      },
      {
        queryFn: async (client: SupabaseClient) => {
          const { data, error } = await client
            .from('organizations')
            .select(`
              *,
              wallets(*),
              application(count)
            `)
            .limit(10)
          if (error) throw error
          return data
        },
        name: 'perf_test_complex_join'
      }
    ]

    const startTime = performance.now()
    const results = await dbOptimizer.executeBatch(testQueries)
    const totalTime = performance.now() - startTime

    return {
      results,
      totalTime: Math.round(totalTime),
      metrics: dbOptimizer.getPerformanceMetrics()
    }
  }
} 