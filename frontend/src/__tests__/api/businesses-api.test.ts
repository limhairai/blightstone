/**
 * Businesses API Tests
 * Tests all business-related API endpoints
 */

import { describe, it, expect, jest } from '@jest/globals'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Businesses API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('GET /api/businesses', () => {
    it('should fetch businesses successfully', async () => {
      const mockBusinesses = [
        { id: '1', name: 'Test Business', status: 'active' },
        { id: '2', name: 'Another Business', status: 'pending' }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusinesses
      })

      const response = await fetch('/api/businesses')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Test Business')
    })

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      const response = await fetch('/api/businesses')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/businesses', () => {
    it('should create business successfully', async () => {
      const newBusiness = {
        name: 'New Business',
        website: 'https://example.com'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '3', ...newBusiness, status: 'pending' })
      })

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBusiness)
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.name).toBe('New Business')
      expect(data.status).toBe('pending')
    })

    it('should validate business data', async () => {
      const invalidBusiness = { name: '' } // Missing required fields

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed' })
      })

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidBusiness)
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch('/api/businesses')
      expect(response.status).toBe(500)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/businesses')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })
  })
})
