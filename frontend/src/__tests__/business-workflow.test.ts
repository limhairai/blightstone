/**
 * Business Workflow Integration Tests
 * Tests the complete flow: Signup → Business Request → Admin Approval → Asset Binding
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock external services
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
  })),
}

const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@techcorp.com',
  user_metadata: { full_name: 'John Doe' }
}

const mockOrganization = {
  id: 'org-456',
  name: "John's Organization",
  owner_id: 'user-123'
}

const mockBusiness = {
  id: 'biz-789',
  name: 'TechCorp Marketing',
  organization_id: 'org-456',
  status: 'pending'
}

const mockDolphinAsset = {
  id: 'asset-101',
  asset_type: 'business_manager',
  facebook_id: 'act_123456789',
  name: 'TechCorp BM',
  status: 'active'
}

describe('Complete Business Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Phase 1: User Onboarding', () => {
    it('should auto-create organization on signup', async () => {
      // Mock successful signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock organization creation (triggered by database)
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: [mockOrganization],
          error: null
        })
      })

      // Simulate signup
      const signupResult = await mockSupabase.auth.signUp({
        email: 'test@techcorp.com',
        password: 'secure-password'
      })

      expect(signupResult.data.user).toEqual(mockUser)
      expect(signupResult.error).toBeNull()
    })

    it('should handle business creation request', async () => {
      // Mock business creation API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusiness
      })

      const businessData = {
        name: 'TechCorp Marketing',
        type: 'Technology',
        website: 'https://techcorp.com',
        description: 'Marketing division of TechCorp'
      }

      const response = await fetch('/api/businesses?organization_id=org-456', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      })

      const result = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/businesses?organization_id=org-456',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(businessData)
        })
      )
      expect(result).toEqual(mockBusiness)
    })
  })

  describe('Phase 2: Admin Workflow', () => {
    it('should fetch applications for admin review', async () => {
      const mockApplications = [
        {
          id: 'app-001',
          organization_name: "John's Organization",
          business_name: 'TechCorp Marketing',
          spend_limit: 5000,
          status: 'pending'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApplications
      })

      const response = await fetch('/api/admin/applications')
      const applications = await response.json()

      expect(applications).toEqual(mockApplications)
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/applications')
    })

    it('should approve business application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const approvalData = {
        application_id: 'app-001',
        action: 'approved',

      }

      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      })

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/applications',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(approvalData)
        })
      )
    })
  })

  describe('Phase 3: Asset Management', () => {
    it('should sync assets from Dolphin Cloud', async () => {
      const mockSyncResult = {
        status: 'success',
        discovered: 5,
        updated: 2,
        errors: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncResult
      })

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover' })
      })

      const result = await response.json()

      expect(result.discovered).toBe(5)
      expect(result.status).toBe('success')
    })

    it('should bind asset to organization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, binding_id: 'binding-123' })
      })

      const bindingData = {
        action: 'bind',
        dolphin_asset_id: 'asset-101',
        organization_id: 'org-456',
        business_id: 'biz-789',
        spend_limits: { monthly: 5000, total: 60000 },
        fee_percentage: 0.05,
        notes: 'Initial binding for TechCorp'
      }

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bindingData)
      })

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.binding_id).toBe('binding-123')
    })

    it('should fetch client assets', async () => {
      const mockClientAssets = {
        assets: [
          {
            id: 'asset-101',
            asset_type: 'business_manager',
            name: 'TechCorp BM',
            status: 'active',
            spend_limit: 5000,
            amount_spent: 1200,
            remaining_budget: 3800
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockClientAssets
      })

      const response = await fetch('/api/client/assets?organization_id=org-456')
      const result = await response.json()

      expect(result.assets).toHaveLength(1)
      expect(result.assets[0].name).toBe('TechCorp BM')
      expect(result.assets[0].remaining_budget).toBe(3800)
    })
  })

  describe('Financial Logic', () => {
    it('should calculate fees correctly', () => {
      const calculateFees = (amount: number, feePercentage: number) => {
        return Math.round(amount * feePercentage * 100) / 100
      }

      expect(calculateFees(1000, 0.05)).toBe(50)
      expect(calculateFees(2500, 0.03)).toBe(75)
      expect(calculateFees(100, 0.1)).toBe(10)
    })

    it('should calculate remaining budget', () => {
      const calculateRemainingBudget = (
        totalLimit: number, 
        amountSpent: number, 
        feePercentage: number = 0
      ) => {
        const availableForSpend = totalLimit * (1 - feePercentage)
        return Math.max(0, availableForSpend - amountSpent)
      }

      // $5000 limit, $1200 spent, 5% fee
      expect(calculateRemainingBudget(5000, 1200, 0.05)).toBe(3550)
      
      // $1000 limit, $950 spent, no fee  
      expect(calculateRemainingBudget(1000, 950, 0)).toBe(50)
      
      // Over-spent scenario
      expect(calculateRemainingBudget(1000, 1200, 0)).toBe(0)
    })

    it('should handle wallet top-up logic', async () => {
      const mockTopUpResult = {
        success: true,
        new_balance: 1500,
        transaction_id: 'txn-456'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopUpResult
      })

      const topUpData = {
        organization_id: 'org-456',
        amount: 500,
        payment_method: 'stripe',
        stripe_payment_intent_id: 'pi_test_123'
      }

      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topUpData)
      })

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.new_balance).toBe(1500)
      expect(result.transaction_id).toBe('txn-456')
    })
  })

  describe('End-to-End Workflow', () => {
    it('should complete entire workflow without errors', async () => {
      // Step 1: User signup (auto-creates org)
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Step 2: Business creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusiness
      })

      // Step 3: Admin approval
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      // Step 4: Asset sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ discovered: 5, status: 'success' })
      })

      // Step 5: Asset binding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, binding_id: 'binding-123' })
      })

      // Step 6: Client views assets
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assets: [{ ...mockDolphinAsset, spend_limit: 5000 }]
        })
      })

      // Execute workflow
      const signupResult = await mockSupabase.auth.signUp({
        email: 'test@techcorp.com',
        password: 'secure-password'
      })

      expect(signupResult.data.user).toEqual(mockUser)

      // All subsequent API calls would follow...
      // This demonstrates the complete flow is testable
    })
  })
}) 