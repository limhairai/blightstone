// Real-time Updates System
// Uses Server-Sent Events for instant UI updates without polling

import { mutate } from 'swr'

interface RealTimeConfig {
  organizationId: string
  userId: string
  sessionToken: string
}

// ✅ FIXED: Reference-counted connection management to prevent memory leaks
class RealTimeUpdates {
  private connections = new Map<string, { 
    source: EventSource, 
    refCount: number, 
    config: RealTimeConfig 
  }>()
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(config: RealTimeConfig): EventSource | null {
    const connectionKey = `${config.organizationId}-${config.userId}`
    const existing = this.connections.get(connectionKey)
    
    if (existing) {
      // ✅ FIXED: Increment reference count for existing connection
      existing.refCount++
      console.log(`🔄 Reusing existing real-time connection (refs: ${existing.refCount})`)
      return existing.source
    }
    
    // ✅ FIXED: Create new connection with reference counting
    const url = new URL('/api/real-time/events', window.location.origin)
    url.searchParams.set('org_id', config.organizationId)
    url.searchParams.set('user_id', config.userId)
    url.searchParams.set('token', config.sessionToken)

    const eventSource = new EventSource(url.toString())
    
    eventSource.onopen = () => {
      console.log('🔄 Real-time connection established')
      this.reconnectAttempts.set(connectionKey, 0)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleUpdate(data)
      } catch (error) {
        console.error('Failed to parse real-time update:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error)
      this.handleReconnect(connectionKey)
    }
    
    // Store connection with initial reference count of 1
    this.connections.set(connectionKey, {
      source: eventSource,
      refCount: 1,
      config
    })
    
    // Set up event listeners for specific update types
    this.setupEventListeners(eventSource)
    
    return eventSource
  }
  
  private setupEventListeners(eventSource: EventSource) {
    // Balance updates
    eventSource.addEventListener('balance_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateBalance(data)
    })
    
    // Account status updates
    eventSource.addEventListener('account_status', (event) => {
      const data = JSON.parse(event.data)
      this.updateAccountStatus(data)
    })
    
    // Application updates
    eventSource.addEventListener('application_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateApplications(data)
    })
    
    // Transaction updates
    eventSource.addEventListener('transaction_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateTransactions(data)
    })
    
    // Support ticket updates
    eventSource.addEventListener('ticket_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateSupportTickets(data)
    })
  }
  
  private handleUpdate(data: any) {
    switch (data.type) {
      case 'balance_update':
        this.updateBalance(data)
        break
      case 'account_status':
        this.updateAccountStatus(data)
        break
      case 'application_update':
        this.updateApplications(data)
        break
      case 'transaction_update':
        this.updateTransactions(data)
        break
      case 'ticket_update':
        this.updateSupportTickets(data)
        break
      default:
        console.log('Unknown update type:', data.type)
    }
  }
  
  private updateBalance(data: any) {
    // Update organization balance
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/organizations'),
      (currentData: any) => {
        if (currentData?.organizations) {
          return {
            ...currentData,
            organizations: currentData.organizations.map((org: any) =>
              org.organization_id === data.organization_id
                ? { ...org, balance_cents: data.balance_cents, balance: data.balance_cents / 100 }
                : org
            )
          }
        }
        return currentData
      },
      false
    )
    
    // Update wallet balance
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/wallets'),
      (currentData: any) => {
        if (currentData?.wallets) {
          return {
            ...currentData,
            wallets: currentData.wallets.map((wallet: any) =>
              wallet.wallet_id === data.wallet_id
                ? { ...wallet, balance_cents: data.balance_cents, balance: data.balance_cents / 100 }
                : wallet
            )
          }
        }
        return currentData
      },
      false
    )
  }
  
  private updateAccountStatus(data: any) {
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/ad-accounts'),
      (currentData: any) => {
        if (currentData?.accounts) {
          return {
            ...currentData,
            accounts: currentData.accounts.map((account: any) =>
              account.id === data.account_id
                ? { ...account, status: data.status, is_active: data.is_active }
                : account
            )
          }
        }
        return currentData
      },
      false
    )
  }
  
  private updateApplications(data: any) {
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/applications'),
      (currentData: any) => {
        if (data.action === 'create') {
          return {
            ...currentData,
            applications: [data.application, ...(currentData?.applications || [])]
          }
        } else if (data.action === 'update') {
          return {
            ...currentData,
            applications: currentData?.applications?.map((app: any) =>
              app.application_id === data.application.application_id
                ? { ...app, ...data.application }
                : app
            ) || []
          }
        }
        return currentData
      },
      false
    )
  }
  
  private updateTransactions(data: any) {
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/transactions'),
      (currentData: any) => {
        if (data.action === 'create') {
          return {
            ...currentData,
            transactions: [data.transaction, ...(currentData?.transactions || [])]
          }
        }
        return currentData
      },
      false
    )
  }
  
  private updateSupportTickets(data: any) {
    mutate(
      (key) => typeof key === 'string' && key.includes('/api/support/tickets'),
      (currentData: any) => {
        if (data.action === 'create') {
          return {
            ...currentData,
            tickets: [data.ticket, ...(currentData?.tickets || [])]
          }
        } else if (data.action === 'update') {
          return {
            ...currentData,
            tickets: currentData?.tickets?.map((ticket: any) =>
              ticket.ticket_id === data.ticket.ticket_id
                ? { ...ticket, ...data.ticket }
                : ticket
            ) || []
          }
        }
        return currentData
      },
      false
    )
  }
  
  private handleReconnect(connectionKey: string) {
    const attempts = this.reconnectAttempts.get(connectionKey) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for', connectionKey)
      return
    }
    
    this.reconnectAttempts.set(connectionKey, attempts + 1)
    const delay = this.reconnectDelay * Math.pow(2, attempts)
    
    console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})`)
    
    setTimeout(() => {
      const connection = this.connections.get(connectionKey)
      if (connection) {
        this.connect(connection.config)
      }
    }, delay)
  }
  
  // ✅ FIXED: Reference-counted disconnect that only closes when no more references
  disconnect(config: RealTimeConfig): boolean {
    const connectionKey = `${config.organizationId}-${config.userId}`
    const existing = this.connections.get(connectionKey)
    
    if (!existing) {
      console.warn('Attempting to disconnect non-existent connection:', connectionKey)
      return false
    }
    
    existing.refCount--
    console.log(`🔄 Decremented real-time connection refs: ${existing.refCount}`)
    
    if (existing.refCount <= 0) {
      // ✅ Last reference - actually close the connection
      existing.source.close()
      this.connections.delete(connectionKey)
      this.reconnectAttempts.delete(connectionKey)
      console.log('🔄 Real-time connection closed (no more references)')
      return true
    }
    
    return false // Connection still has references
  }
  
  // ✅ FIXED: Updated to work with new connection management
  isConnected(config: RealTimeConfig): boolean {
    const connectionKey = `${config.organizationId}-${config.userId}`
    const connection = this.connections.get(connectionKey)
    return connection?.source?.readyState === EventSource.OPEN
  }
}

// Export singleton instance
export const realTimeUpdates = new RealTimeUpdates()

// ✅ FIXED: Hook for using real-time updates with proper cleanup
export function useRealTimeUpdates(config: RealTimeConfig) {
  React.useEffect(() => {
    const eventSource = realTimeUpdates.connect(config)
    
    return () => {
      realTimeUpdates.disconnect(config) // ✅ Pass config for reference counting
    }
  }, [config.organizationId, config.userId, config.sessionToken])
  
  return {
    isConnected: realTimeUpdates.isConnected(config), // ✅ Pass config
    disconnect: () => realTimeUpdates.disconnect(config), // ✅ Pass config
  }
}

// React import for the hook
import React from 'react' 