import { appDataReducer } from '../contexts/AppDataContext'
import type { AppState } from '../contexts/AppDataContext'

// Property-based testing utilities
const generateRandomAmount = () => Math.random() * 10000
const generateRandomOperations = (count: number) => {
  const operations = []
  for (let i = 0; i < count; i++) {
    operations.push({
      type: Math.random() > 0.5 ? 'add' : 'subtract' as 'add' | 'subtract',
      amount: generateRandomAmount()
    })
  }
  return operations
}

const createTestState = (initialBalance: number): AppState => ({
  dataSource: 'demo',
  userRole: 'client',
  businesses: [],
  accounts: [{
    id: 'test-account',
    name: 'Test Account',
    status: 'active',
    balance: 500,
    dateAdded: '2024-01-01'
  }],
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
    totalBalance: initialBalance,
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
    emailVerified: false,
    organizationCreated: false,
    firstBusinessAdded: false,
    firstAccountConnected: false,
    firstTopUp: false
  }
})

describe('Financial Properties - Invariant Testing', () => {
  describe('Conservation of Money Property', () => {
    test('total system money should be conserved across operations', () => {
      // Run this test 100 times with random data
      for (let testRun = 0; testRun < 100; testRun++) {
        const initialWalletBalance = generateRandomAmount()
        const initialAccountBalance = generateRandomAmount()
        
        let state = createTestState(initialWalletBalance)
        state.accounts[0].balance = initialAccountBalance
        
        const initialTotal = initialWalletBalance + initialAccountBalance
        const operations = generateRandomOperations(10)
        
        let walletBalance = initialWalletBalance
        let accountBalance = initialAccountBalance
        
        for (const op of operations) {
          if (op.type === 'add') {
            // Adding to wallet (external funding)
            state = appDataReducer(state, {
              type: 'UPDATE_WALLET_BALANCE',
              payload: { amount: op.amount, type: 'add' }
            })
            walletBalance += op.amount
          } else {
            // Transferring from wallet to account
            if (walletBalance >= op.amount) {
              state = appDataReducer(state, {
                type: 'UPDATE_WALLET_BALANCE',
                payload: { amount: op.amount, type: 'subtract' }
              })
              state = appDataReducer(state, {
                type: 'UPDATE_ACCOUNT',
                payload: {
                  ...state.accounts[0],
                  balance: state.accounts[0].balance + op.amount
                }
              })
              walletBalance -= op.amount
              accountBalance += op.amount
            }
          }
        }
        
        const finalTotal = state.financialData.totalBalance + state.accounts[0].balance
        const expectedTotal = walletBalance + accountBalance
        
        // Money should be conserved (allowing for external additions)
        expect(finalTotal).toBeCloseTo(expectedTotal, 2)
        expect(state.financialData.totalBalance).toBeGreaterThanOrEqual(0)
        expect(state.accounts[0].balance).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Non-Negative Balance Property', () => {
    test('wallet balance should never go negative', () => {
      for (let testRun = 0; testRun < 50; testRun++) {
        const initialBalance = generateRandomAmount()
        let state = createTestState(initialBalance)
        
        // Try to subtract more than available
        const excessiveAmount = initialBalance + generateRandomAmount()
        
        state = appDataReducer(state, {
          type: 'UPDATE_WALLET_BALANCE',
          payload: { amount: excessiveAmount, type: 'subtract' }
        })
        
        expect(state.financialData.totalBalance).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Arithmetic Precision Property', () => {
    test('financial calculations should maintain precision', () => {
      const state = createTestState(100.00)
      
      // Test with decimal amounts that could cause floating point issues
      const precisionTests = [
        0.01, 0.10, 0.33, 1.99, 10.05, 99.99
      ]
      
      let currentState = state
      let expectedBalance = 100.00
      
      for (const amount of precisionTests) {
        currentState = appDataReducer(currentState, {
          type: 'UPDATE_WALLET_BALANCE',
          payload: { amount, type: 'add' }
        })
        expectedBalance += amount
        
        // Use toBeCloseTo to handle floating point precision
        expect(currentState.financialData.totalBalance).toBeCloseTo(expectedBalance, 2)
      }
    })
  })

  describe('Idempotency Property', () => {
    test('applying same operation twice should not have different effect', () => {
      const state = createTestState(1000)
      
      // Apply operation once
      const state1 = appDataReducer(state, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 100, type: 'add' }
      })
      
      // Apply same operation to original state
      const state2 = appDataReducer(state, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 100, type: 'add' }
      })
      
      // Results should be identical
      expect(state1.financialData.totalBalance).toBe(state2.financialData.totalBalance)
      expect(state1.financialData.totalBalance).toBe(1100)
    })
  })

  describe('Commutative Property for Additions', () => {
    test('order of additions should not matter', () => {
      const initialState = createTestState(1000)
      
      // Path 1: Add 100, then 200
      let state1 = appDataReducer(initialState, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 100, type: 'add' }
      })
      state1 = appDataReducer(state1, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 200, type: 'add' }
      })
      
      // Path 2: Add 200, then 100
      let state2 = appDataReducer(initialState, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 200, type: 'add' }
      })
      state2 = appDataReducer(state2, {
        type: 'UPDATE_WALLET_BALANCE',
        payload: { amount: 100, type: 'add' }
      })
      
      // Final balances should be identical
      expect(state1.financialData.totalBalance).toBe(state2.financialData.totalBalance)
      expect(state1.financialData.totalBalance).toBe(1300)
    })
  })
})

describe('Financial Edge Cases', () => {
  test('handles maximum safe integer amounts', () => {
    const state = createTestState(0)
    const maxSafeAmount = Number.MAX_SAFE_INTEGER / 2 // Avoid overflow
    
    const newState = appDataReducer(state, {
      type: 'UPDATE_WALLET_BALANCE',
      payload: { amount: maxSafeAmount, type: 'add' }
    })
    
    expect(newState.financialData.totalBalance).toBe(maxSafeAmount)
    expect(Number.isSafeInteger(newState.financialData.totalBalance)).toBe(true)
  })

  test('handles very small decimal amounts', () => {
    const state = createTestState(1000)
    const tinyAmount = 0.001
    
    const newState = appDataReducer(state, {
      type: 'UPDATE_WALLET_BALANCE',
      payload: { amount: tinyAmount, type: 'add' }
    })
    
    expect(newState.financialData.totalBalance).toBeCloseTo(1000.001, 3)
  })
}) 