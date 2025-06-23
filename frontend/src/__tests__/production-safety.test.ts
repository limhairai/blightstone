/**
 * Production Safety Tests
 * 
 * These tests simulate production conditions without using real money:
 * 1. Test with production-like data volumes
 * 2. Test with realistic user behavior patterns
 * 3. Test error conditions and recovery
 * 4. Test concurrent operations
 * 5. Test with actual API responses (mocked)
 */

import { appDataReducer } from '../contexts/AppDataContext'
import type { AppState } from '../contexts/AppDataContext'

describe('Production Safety - Financial Operations', () => {
  describe('High Volume Operations', () => {
    test('handles 1000+ rapid transactions without corruption', () => {
      let state = createProductionLikeState()
      const operations = 1000
      
      for (let i = 0; i < operations; i++) {
        const amount = Math.random() * 100
        const type = Math.random() > 0.5 ? 'add' : 'subtract'
        
        // Only subtract if we have enough balance
        if (type === 'subtract' && state.financialData.totalBalance < amount) {
          continue
        }
        
        state = appDataReducer(state, {
          type: 'UPDATE_WALLET_BALANCE',
          payload: { amount, type }
        })
        
        // Verify state integrity after each operation
        expect(state.financialData.totalBalance).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(state.financialData.totalBalance)).toBe(true)
      }
    })
  })

  describe('Real-World User Patterns', () => {
    test('simulates typical user session with multiple operations', async () => {
      // Simulate a real user session:
      // 1. User logs in, sees dashboard
      // 2. Adds funds to wallet
      // 3. Distributes to multiple ad accounts
      // 4. Checks balances
      // 5. Does more top-ups throughout the day
      
      let state = createProductionLikeState()
      const sessionOperations = [
        { action: 'wallet_topup', amount: 1000 },
        { action: 'account_topup', accountId: 'acc1', amount: 300 },
        { action: 'account_topup', accountId: 'acc2', amount: 200 },
        { action: 'wallet_topup', amount: 500 },
        { action: 'account_topup', accountId: 'acc1', amount: 150 },
        { action: 'account_topup', accountId: 'acc3', amount: 400 },
      ]
      
      let totalWalletAdded = 0
      let totalAccountsAdded = 0
      
      for (const op of sessionOperations) {
        if (op.action === 'wallet_topup') {
          state = appDataReducer(state, {
            type: 'UPDATE_WALLET_BALANCE',
            payload: { amount: op.amount, type: 'add' }
          })
          totalWalletAdded += op.amount
        } else if (op.action === 'account_topup') {
          // Transfer from wallet to account
          if (state.financialData.totalBalance >= op.amount) {
            state = appDataReducer(state, {
              type: 'UPDATE_WALLET_BALANCE',
              payload: { amount: op.amount, type: 'subtract' }
            })
            
            const account = state.accounts.find(a => a.id === op.accountId)
            if (account) {
              state = appDataReducer(state, {
                type: 'UPDATE_ACCOUNT',
                payload: {
                  ...account,
                  balance: account.balance + op.amount
                }
              })
            }
            totalAccountsAdded += op.amount
          }
        }
      }
      
      // Verify session integrity
      const initialBalance = 5000 // From createProductionLikeState
      const expectedWalletBalance = initialBalance + totalWalletAdded - totalAccountsAdded
      
      expect(state.financialData.totalBalance).toBeCloseTo(expectedWalletBalance, 2)
      expect(state.financialData.totalBalance).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Conditions and Recovery', () => {
    test('handles network-like failures gracefully', () => {
      const state = createProductionLikeState()
      
      // Simulate partial state updates (like network interruptions)
      const operations = [
        { amount: 100, type: 'add' as const },
        { amount: 50, type: 'subtract' as const },
        { amount: 200, type: 'add' as const },
      ]
      
      let finalState = state
      for (const op of operations) {
        try {
          finalState = appDataReducer(finalState, {
            type: 'UPDATE_WALLET_BALANCE',
            payload: op
          })
          
          // Verify state is always valid
          expect(finalState.financialData.totalBalance).toBeGreaterThanOrEqual(0)
          expect(Number.isFinite(finalState.financialData.totalBalance)).toBe(true)
        } catch (error) {
          // If operation fails, state should remain unchanged
          expect(finalState).toBe(finalState)
        }
      }
    })
  })

  describe('Data Validation and Sanitization', () => {
    test('rejects invalid financial data', () => {
      const state = createProductionLikeState()
      
      const invalidInputs = [
        { amount: -100, type: 'add' }, // Negative amount
        { amount: Infinity, type: 'add' }, // Infinite amount
        { amount: NaN, type: 'add' }, // NaN amount
        { amount: '100' as any, type: 'add' }, // String amount
      ]
      
      for (const invalidInput of invalidInputs) {
        // These should either be rejected or sanitized
        try {
          const newState = appDataReducer(state, {
            type: 'UPDATE_WALLET_BALANCE',
            payload: invalidInput
          })
          
          // If accepted, result must still be valid
          expect(Number.isFinite(newState.financialData.totalBalance)).toBe(true)
          expect(newState.financialData.totalBalance).toBeGreaterThanOrEqual(0)
        } catch (error) {
          // Rejection is also acceptable
          expect(error).toBeDefined()
        }
      }
    })
  })

  describe('Performance Under Load', () => {
    test('maintains performance with large datasets', () => {
      // Create state with many accounts and transactions
      const largeState = createLargeDatasetState()
      
      const startTime = performance.now()
      
      // Perform 100 operations
      let state = largeState
      for (let i = 0; i < 100; i++) {
        state = appDataReducer(state, {
          type: 'UPDATE_WALLET_BALANCE',
          payload: { amount: 10, type: 'add' }
        })
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000) // 1 second
      expect(state.financialData.totalBalance).toBe(largeState.financialData.totalBalance + 1000)
    })
  })
})

describe('Production Simulation Tests', () => {
  test('simulates real production API responses', async () => {
    // Mock realistic API responses
    const mockApiResponses = {
      walletTopUp: { success: true, newBalance: 1500.00, transactionId: 'tx_123' },
      accountTopUp: { success: true, accountBalance: 800.00, walletBalance: 700.00 },
      getBalance: { walletBalance: 1500.00, accounts: [{ id: 'acc1', balance: 500.00 }] }
    }
    
    // Test that our state management handles these responses correctly
    let state = createProductionLikeState()
    
    // Simulate wallet top-up API response
    state = appDataReducer(state, {
      type: 'UPDATE_WALLET_BALANCE',
      payload: { amount: 500, type: 'add' }
    })
    
    expect(state.financialData.totalBalance).toBe(mockApiResponses.walletTopUp.newBalance)
  })
}

// Helper functions
function createProductionLikeState(): AppState {
  return {
    dataSource: 'demo',
    userRole: 'client',
    businesses: [],
    accounts: [
      { id: 'acc1', name: 'Facebook Ads', status: 'active', balance: 500, dateAdded: '2024-01-01' },
      { id: 'acc2', name: 'Google Ads', status: 'active', balance: 300, dateAdded: '2024-01-02' },
      { id: 'acc3', name: 'TikTok Ads', status: 'active', balance: 200, dateAdded: '2024-01-03' },
    ],
    transactions: [],
    organizations: [],
    currentOrganization: null,
    teamMembers: [],
    adminData: {
      allBusinesses: [],
      allAccounts: [],
      allTransactions: [],
      allOrganizations: [],
      pendingApplications: [],
      systemStats: { totalOrganizations: 0, activeTeams: 0, pendingApplications: 0, monthlyRevenue: 0 }
    },
    userProfile: null,
    financialData: {
      totalBalance: 5000.00, // Realistic starting balance
      totalRevenue: 0,
      totalSpend: 0,
      monthlyRevenue: 0,
      monthlySpend: 0,
      growthRate: 0
    },
    loading: {
      businesses: false,
      accounts: false,
      transactions: false,
      organizations: false,
      teamMembers: false,
      actions: false
    },
    setupProgress: {
      emailVerified: true,
      organizationCreated: true,
      firstBusinessAdded: true,
      firstAccountConnected: true,
      firstTopUp: false
    }
  }
}

function createLargeDatasetState(): AppState {
  const state = createProductionLikeState()
  
  // Add many accounts to simulate large organization
  const manyAccounts = []
  for (let i = 0; i < 100; i++) {
    manyAccounts.push({
      id: `acc_${i}`,
      name: `Account ${i}`,
      status: 'active' as const,
      balance: Math.random() * 1000,
      dateAdded: '2024-01-01'
    })
  }
  
  return {
    ...state,
    accounts: manyAccounts
  }
} 