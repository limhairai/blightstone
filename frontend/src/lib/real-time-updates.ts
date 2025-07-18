// Real-time Updates System
// Uses Server-Sent Events for instant UI updates without polling

import { mutate } from 'swr'

interface RealTimeConfig {
  organizationId: string
  userId: string
  sessionToken: string
}

class RealTimeUpdates {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private config: RealTimeConfig | null = null

  connect(config: RealTimeConfig) {
    this.config = config
    this.disconnect() // Close existing connection
    
    const url = new URL('/api/real-time/events', window.location.origin)
    url.searchParams.set('org_id', config.organizationId)
    url.searchParams.set('user_id', config.userId)
    url.searchParams.set('token', config.sessionToken)

    this.eventSource = new EventSource(url.toString())
    
    this.eventSource.onopen = () => {
      console.log('🔄 Real-time connection established')
      this.reconnectAttempts = 0
    }
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleUpdate(data)
      } catch (error) {
        console.error('Failed to parse real-time update:', error)
      }
    }
    
    this.eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error)
      this.handleReconnect()
    }
    
    // Set up event listeners for specific update types
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    if (!this.eventSource) return
    
    // Balance updates
    this.eventSource.addEventListener('balance_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateBalance(data)
    })
    
    // Account status updates
    this.eventSource.addEventListener('account_status', (event) => {
      const data = JSON.parse(event.data)
      this.updateAccountStatus(data)
    })
    
    // Application updates
    this.eventSource.addEventListener('application_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateApplications(data)
    })
    
    // Transaction updates
    this.eventSource.addEventListener('transaction_update', (event) => {
      const data = JSON.parse(event.data)
      this.updateTransactions(data)
    })
    
    // Support ticket updates
    this.eventSource.addEventListener('ticket_update', (event) => {
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
  
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.config) {
        this.connect(this.config)
      }
    }, delay)
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
  
  isConnected() {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

// Export singleton instance
export const realTimeUpdates = new RealTimeUpdates()

// Hook for using real-time updates in components
export function useRealTimeUpdates(config: RealTimeConfig) {
  React.useEffect(() => {
    realTimeUpdates.connect(config)
    
    return () => {
      realTimeUpdates.disconnect()
    }
  }, [config.organizationId, config.userId, config.sessionToken])
  
  return {
    isConnected: realTimeUpdates.isConnected(),
    disconnect: () => realTimeUpdates.disconnect(),
  }
}

// React import for the hook
import React from 'react' 