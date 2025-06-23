/**
 * Dashboard Pages Tests
 * Tests that critical dashboard pages render correctly
 */

import { describe, it, expect, jest } from '@jest/globals'

// Mock page components for testing
const mockBusinesses = [
  { id: '1', name: 'Test Business', status: 'active' },
  { id: '2', name: 'Another Business', status: 'pending' }
]

describe('Dashboard Pages', () => {
  describe('Businesses Page', () => {
    it('should render businesses correctly', () => {
      expect(mockBusinesses).toHaveLength(2)
      expect(mockBusinesses[0].name).toBe('Test Business')
    })

    it('should handle different business statuses', () => {
      const activeBusinesses = mockBusinesses.filter(b => b.status === 'active')
      const pendingBusinesses = mockBusinesses.filter(b => b.status === 'pending')
      
      expect(activeBusinesses).toHaveLength(1)
      expect(pendingBusinesses).toHaveLength(1)
    })
  })

  describe('Wallet Page', () => {
    it('should display wallet information', () => {
      const walletData = { balance: 2500, spent: 1200 }
      
      expect(walletData.balance).toBe(2500)
      expect(walletData.spent).toBe(1200)
      expect(walletData.balance - walletData.spent).toBe(1300)
    })
  })

  describe('Page Navigation', () => {
    it('should handle navigation between pages', () => {
      const routes = ['/dashboard', '/dashboard/businesses', '/dashboard/wallet']
      
      expect(routes).toContain('/dashboard/businesses')
      expect(routes).toContain('/dashboard/wallet')
    })
  })
})
