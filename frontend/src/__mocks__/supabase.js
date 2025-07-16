/**
 * Supabase Mock for Jest Tests
 * 
 * This mock simulates all Supabase operations with realistic data
 * to enable comprehensive testing without hitting real database
 */

// Mock user data
const mockUsers = {
  'user-123': {
    id: 'user-123',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  'admin-456': {
    id: 'admin-456',
    email: 'admin@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    user_metadata: { role: 'admin' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

// Mock organizations
const mockOrganizations = {
  'org-123': {
    id: 'org-123',
    name: 'Test Organization',
    balance_cents: 10000, // $100.00
    subscription_tier: 'pro',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

// Mock business managers
const mockBusinessManagers = {
  'bm-123': {
    id: 'bm-123',
    name: 'Test Business Manager',
    fb_business_id: 'fb-bm-123',
    status: 'active',
    organization_id: 'org-123',
    created_at: '2024-01-01T00:00:00Z',
  }
}

// Mock ad accounts
const mockAdAccounts = {
  'ad-123': {
    id: 'ad-123',
    name: 'Test Ad Account',
    fb_account_id: 'act_123456789',
    status: 'active',
    balance_cents: 5000, // $50.00
    organization_id: 'org-123',
    business_manager_id: 'bm-123',
    created_at: '2024-01-01T00:00:00Z',
  }
}

// Mock transactions
const mockTransactions = {
  'txn-123': {
    id: 'txn-123',
    amount_cents: 10000, // $100.00
    currency: 'USD',
    type: 'credit',
    status: 'completed',
    organization_id: 'org-123',
    created_at: '2024-01-01T00:00:00Z',
  }
}

// Mock Dolphin assets
const mockDolphinAssets = {
  'asset-123': {
    id: 'asset-123',
    type: 'business_manager',
    dolphin_id: 'dolphin-bm-123',
    name: 'Dolphin Business Manager',
    status: 'active',
    health_status: 'healthy',
    metadata: {
      fb_business_id: 'fb-bm-123',
      verification_status: 'verified'
    },
    created_at: '2024-01-01T00:00:00Z',
  }
}

// Mock query builder
class MockQueryBuilder {
  constructor(table, data) {
    this.table = table
    this.data = data
    this.filters = []
    this.selectFields = '*'
    this.orderBy = null
    this.limitCount = null
    this.singleResult = false
  }

  select(fields = '*') {
    this.selectFields = fields
    return this
  }

  eq(column, value) {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  neq(column, value) {
    this.filters.push({ column, operator: 'neq', value })
    return this
  }

  in(column, values) {
    this.filters.push({ column, operator: 'in', value: values })
    return this
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false }
    return this
  }

  limit(count) {
    this.limitCount = count
    return this
  }

  single() {
    this.singleResult = true
    return this
  }

  async then(resolve) {
    let results = Object.values(this.data)

    // Apply filters
    results = results.filter(item => {
      return this.filters.every(filter => {
        const value = item[filter.column]
        switch (filter.operator) {
          case 'eq':
            return value === filter.value
          case 'neq':
            return value !== filter.value
          case 'in':
            return filter.value.includes(value)
          default:
            return true
        }
      })
    })

    // Apply ordering
    if (this.orderBy) {
      results.sort((a, b) => {
        const aVal = a[this.orderBy.column]
        const bVal = b[this.orderBy.column]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return this.orderBy.ascending ? comparison : -comparison
      })
    }

    // Apply limit
    if (this.limitCount) {
      results = results.slice(0, this.limitCount)
    }

    // Return single result or array
    if (this.singleResult) {
      return resolve({
        data: results[0] || null,
        error: results.length === 0 ? { code: 'PGRST116', message: 'No rows found' } : null
      })
    }

    return resolve({
      data: results,
      error: null
    })
  }

  // For upsert operations
  upsert(data) {
    const id = data.id || `${this.table}-${Date.now()}`
    const record = { ...data, id, updated_at: new Date().toISOString() }
    
    if (this.data[id]) {
      this.data[id] = { ...this.data[id], ...record }
    } else {
      this.data[id] = { ...record, created_at: new Date().toISOString() }
    }

    return {
      select: () => ({
        single: () => Promise.resolve({
          data: this.data[id],
          error: null
        })
      })
    }
  }

  // For insert operations
  insert(data) {
    const records = Array.isArray(data) ? data : [data]
    const insertedRecords = records.map(record => {
      const id = record.id || `${this.table}-${Date.now()}-${Math.random()}`
      const newRecord = {
        ...record,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.data[id] = newRecord
      return newRecord
    })

    return {
      select: () => ({
        single: () => Promise.resolve({
          data: insertedRecords[0],
          error: null
        })
      })
    }
  }

  // For update operations
  update(data) {
    const updatedRecords = []
    
    Object.keys(this.data).forEach(id => {
      const item = this.data[id]
      const matches = this.filters.every(filter => {
        const value = item[filter.column]
        switch (filter.operator) {
          case 'eq':
            return value === filter.value
          case 'neq':
            return value !== filter.value
          case 'in':
            return filter.value.includes(value)
          default:
            return true
        }
      })

      if (matches) {
        this.data[id] = {
          ...item,
          ...data,
          updated_at: new Date().toISOString()
        }
        updatedRecords.push(this.data[id])
      }
    })

    return {
      select: () => ({
        single: () => Promise.resolve({
          data: updatedRecords[0] || null,
          error: updatedRecords.length === 0 ? { message: 'No rows updated' } : null
        })
      })
    }
  }

  // For delete operations
  delete() {
    const deletedRecords = []
    
    Object.keys(this.data).forEach(id => {
      const item = this.data[id]
      const matches = this.filters.every(filter => {
        const value = item[filter.column]
        switch (filter.operator) {
          case 'eq':
            return value === filter.value
          case 'neq':
            return value !== filter.value
          case 'in':
            return filter.value.includes(value)
          default:
            return true
        }
      })

      if (matches) {
        deletedRecords.push(this.data[id])
        delete this.data[id]
      }
    })

    return Promise.resolve({
      data: deletedRecords,
      error: null
    })
  }
}

// Mock auth methods
const mockAuth = {
  signUp: jest.fn().mockResolvedValue({
    data: { user: mockUsers['user-123'], session: null },
    error: null
  }),
  
  signInWithPassword: jest.fn().mockResolvedValue({
    data: { 
      user: mockUsers['user-123'], 
      session: { 
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        user: mockUsers['user-123']
      }
    },
    error: null
  }),

  signInWithOAuth: jest.fn().mockResolvedValue({
    data: { url: 'https://oauth.example.com/auth' },
    error: null
  }),

  signOut: jest.fn().mockResolvedValue({
    error: null
  }),

  resetPasswordForEmail: jest.fn().mockResolvedValue({
    data: {},
    error: null
  }),

  getUser: jest.fn().mockResolvedValue({
    data: { user: mockUsers['user-123'] },
    error: null
  }),

  getSession: jest.fn().mockResolvedValue({
    data: { 
      session: { 
        access_token: 'mock-token',
        user: mockUsers['user-123']
      }
    },
    error: null
  }),

  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } }
  })
}

// Mock storage methods
const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn().mockResolvedValue({
      data: { path: 'mock-file-path.jpg' },
      error: null
    }),
    download: jest.fn().mockResolvedValue({
      data: new Blob(['mock file content']),
      error: null
    }),
    remove: jest.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://mock-storage.com/file.jpg' }
    })
  })
}

// Mock realtime methods
const mockRealtime = {
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnValue({
      subscribe: jest.fn().mockResolvedValue('OK')
    }),
    unsubscribe: jest.fn().mockResolvedValue('OK')
  })
}

// Mock Supabase client
const mockSupabase = {
  auth: mockAuth,
  storage: mockStorage,
  realtime: mockRealtime,
  
  from: (table) => {
    const data = {
      profiles: mockUsers,
      organizations: mockOrganizations,
      business_managers: mockBusinessManagers,
      ad_accounts: mockAdAccounts,
      transactions: mockTransactions,
      assets: mockDolphinAssets,
      asset_binding: {}
    }[table] || {}
    
    return new MockQueryBuilder(table, data)
  }
}

// Export functions that create the mock client
export const createClient = jest.fn().mockReturnValue(mockSupabase)
export const createBrowserClient = jest.fn().mockReturnValue(mockSupabase)
export const createServerClient = jest.fn().mockReturnValue(mockSupabase)

// Default export
export default mockSupabase

// Named exports for different import patterns
export { mockSupabase as supabase }
export { mockAuth, mockStorage, mockRealtime } 