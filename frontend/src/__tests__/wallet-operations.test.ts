import { appDataReducer } from '../contexts/AppDataContext'
import type { AppState, AppAction } from '../contexts/AppDataContext'

// Mock initial state for testing
const mockInitialState: AppState = {
  dataSource: 'demo',
  userRole: 'client',
  businesses: [],
  accounts: [],
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
    systemStats: {
      totalOrganizations: 0,
      activeTeams: 0,
      pendingApplications: 0,
      monthlyRevenue: 0
    }
  },
  userProfile: null,
  financialData: {
    totalBalance: 1000.00,
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
}

describe('Wallet Operations - Financial Logic Tests', () => {
  test('should ADD money to wallet when type is "add"', () => {
    const action: AppAction = {
      type: 'UPDATE_WALLET_BALANCE',
      payload: { amount: 500, type: 'add' }
    }

    const newState = appDataReducer(mockInitialState, action)
    expect(newState.financialData.totalBalance).toBe(1500.00)
  })

  test('should SUBTRACT money from wallet when type is "subtract"', () => {
    const action: AppAction = {
      type: 'UPDATE_WALLET_BALANCE',
      payload: { amount: 300, type: 'subtract' }
    }

    const newState = appDataReducer(mockInitialState, action)
    expect(newState.financialData.totalBalance).toBe(700.00)
  })
})
