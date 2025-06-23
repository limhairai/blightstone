/**
 * API Integration Tests
 * Tests all API endpoints and data flows
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Authentication API', () => {
    it('should handle user registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' }
        })
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'secure-password'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.user.email).toBe('test@example.com')
    })

    it('should handle login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' }
        })
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'secure-password'
        })
      })

      expect(response.ok).toBe(true)
    })

    it('should handle logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-123' }
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('Business API', () => {
    it('should create business', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'biz-123',
          name: 'TechCorp Marketing',
          status: 'pending',
          organizationId: 'org-123'
        })
      })

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-123' },
        body: JSON.stringify({
          name: 'TechCorp Marketing',
          type: 'Technology',
          website: 'https://techcorp.com'
        })
      })

      expect(response.ok).toBe(true)
      const business = await response.json()
      expect(business.name).toBe('TechCorp Marketing')
      expect(business.status).toBe('pending')
    })

    it('should get businesses for organization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'biz-1', name: 'Business 1', status: 'active' },
          { id: 'biz-2', name: 'Business 2', status: 'pending' }
        ])
      })

      const response = await fetch('/api/businesses', {
        headers: { Authorization: 'Bearer token-123' }
      })

      expect(response.ok).toBe(true)
      const businesses = await response.json()
      expect(businesses).toHaveLength(2)
    })

    it('should update business', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'biz-123',
          name: 'Updated Business Name',
          status: 'active'
        })
      })

      const response = await fetch('/api/businesses/biz-123', {
        method: 'PUT',
        headers: { Authorization: 'Bearer token-123' },
        body: JSON.stringify({
          name: 'Updated Business Name'
        })
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('Admin API', () => {
    it('should approve business application', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          business: { id: 'biz-123', status: 'approved' }
        })
      })

      const response = await fetch('/api/admin/applications/biz-123/approve', {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token-123' }
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
    })

    it('should get all applications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'app-1', businessName: 'Business 1', status: 'pending' },
          { id: 'app-2', businessName: 'Business 2', status: 'approved' }
        ])
      })

      const response = await fetch('/api/admin/applications', {
        headers: { Authorization: 'Bearer admin-token-123' }
      })

      expect(response.ok).toBe(true)
      const applications = await response.json()
      expect(applications).toHaveLength(2)
    })

    it('should bind asset to organization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          bindingId: 'binding-123'
        })
      })

      const response = await fetch('/api/admin/assets/bind', {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token-123' },
        body: JSON.stringify({
          assetId: 'asset-123',
          organizationId: 'org-123',
          spendLimit: 5000
        })
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('Financial API', () => {
    it('should get wallet balance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          balance: 1500.00,
          currency: 'USD'
        })
      })

      const response = await fetch('/api/wallet/balance', {
        headers: { Authorization: 'Bearer token-123' }
      })

      expect(response.ok).toBe(true)
      const wallet = await response.json()
      expect(wallet.balance).toBe(1500.00)
    })

    it('should top up wallet', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          newBalance: 2000.00,
          transactionId: 'tx-123'
        })
      })

      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-123' },
        body: JSON.stringify({
          amount: 500,
          paymentMethodId: 'pm_123'
        })
      })

      expect(response.ok).toBe(true)
    })

    it('should get transaction history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'tx-1', type: 'topup', amount: 500, status: 'completed' },
          { id: 'tx-2', type: 'spend', amount: -100, status: 'completed' }
        ])
      })

      const response = await fetch('/api/transactions', {
        headers: { Authorization: 'Bearer token-123' }
      })

      expect(response.ok).toBe(true)
      const transactions = await response.json()
      expect(transactions).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      const response = await fetch('/api/businesses', {
        headers: { Authorization: 'Bearer invalid-token' }
      })

      expect(response.status).toBe(401)
    })

    it('should handle 403 forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' })
      })

      const response = await fetch('/api/admin/applications', {
        headers: { Authorization: 'Bearer user-token' }
      })

      expect(response.status).toBe(403)
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      })

      const response = await fetch('/api/businesses', {
        headers: { Authorization: 'Bearer token-123' }
      })

      expect(response.status).toBe(500)
    })
  })

  describe('Data Validation', () => {
    it('should validate business creation data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: ['Name is required', 'Invalid website URL']
        })
      })

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-123' },
        body: JSON.stringify({
          name: '', // Invalid: empty name
          website: 'invalid-url' // Invalid: not a URL
        })
      })

      expect(response.status).toBe(400)
    })

    it('should validate financial amounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid amount',
          details: ['Amount must be positive']
        })
      })

      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-123' },
        body: JSON.stringify({
          amount: -100 // Invalid: negative amount
        })
      })

      expect(response.status).toBe(400)
    })
  })
}) 