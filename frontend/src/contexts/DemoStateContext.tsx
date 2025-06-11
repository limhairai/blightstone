"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { 
  MOCK_FINANCIAL_DATA, 
  MOCK_BUSINESSES, 
  MOCK_ACCOUNTS, 
  MOCK_TRANSACTIONS,
  MOCK_ORGANIZATIONS,
  MOCK_BUSINESSES_BY_ORG,
  MOCK_FINANCIAL_DATA_BY_ORG,
  MOCK_ACCOUNTS_BY_ORG,
  MOCK_TRANSACTIONS_BY_ORG,
  MOCK_TEAM_MEMBERS_BY_ORG,
  type MockBusiness,
  type MockAccount,
  type MockTransaction,
  type MockOrganization
} from '../lib/mock-data'
import { toast } from 'sonner'

// Team member interface
export interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  status: "active" | "pending" | "suspended"
  joined: string
  lastLogin?: string
  avatar?: string
  signInCount: number
  authentication: string
  invitedBy?: string
  permissions: {
    canManageTeam: boolean
    canManageBusinesses: boolean
    canManageAccounts: boolean
    canManageWallet: boolean
    canViewAnalytics: boolean
  }
}

// User profile interface
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  phone?: string
  timezone: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    connectedAccounts: Array<{
      provider: string
      email: string
      connected: boolean
    }>
  }
}

// Mock data for team and user
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "owner",
    status: "active",
    joined: "Jan 12, 2025",
    lastLogin: "Jun 8, 2025, 09:15 AM",
    authentication: "Google",
    signInCount: 57,
    permissions: {
      canManageTeam: true,
      canManageBusinesses: true,
      canManageAccounts: true,
      canManageWallet: true,
      canViewAnalytics: true
    }
  },
  {
    id: "2",
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "admin",
    status: "active",
    joined: "Mar 5, 2025",
    lastLogin: "Jun 7, 2025, 11:42 AM",
    authentication: "Google",
    signInCount: 24,
    invitedBy: "John Doe",
    permissions: {
      canManageTeam: true,
      canManageBusinesses: true,
      canManageAccounts: true,
      canManageWallet: false,
      canViewAnalytics: true
    }
  },
  {
    id: "3",
    name: "Sam Lee",
    email: "sam@example.com",
    role: "member",
    status: "active",
    joined: "Apr 17, 2025",
    lastLogin: "Apr 17, 2025, 03:18 PM",
    authentication: "Text Provider",
    signInCount: 1,
    invitedBy: "Alex Johnson",
    permissions: {
      canManageTeam: false,
      canManageBusinesses: false,
      canManageAccounts: true,
      canManageWallet: false,
      canViewAnalytics: true
    }
  },
  {
    id: "4",
    name: "Taylor Wilson",
    email: "taylor@example.com",
    role: "member",
    status: "pending",
    joined: "Jun 5, 2025",
    authentication: "Pending",
    signInCount: 0,
    invitedBy: "John Doe",
    permissions: {
      canManageTeam: false,
      canManageBusinesses: false,
      canManageAccounts: false,
      canManageWallet: false,
      canViewAnalytics: false
    }
  }
]

const MOCK_USER_PROFILE: UserProfile = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  timezone: "America/New_York",
  language: "en",
  notifications: {
    email: true,
    push: true,
    sms: false,
    marketing: false
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: "Mar 15, 2025",
    connectedAccounts: [
      {
        provider: "Google",
        email: "john.doe@gmail.com",
        connected: true
      },
      {
        provider: "Microsoft",
        email: "john.doe@outlook.com",
        connected: false
      }
    ]
  }
}

// State interface
interface DemoState {
  organizations: MockOrganization[]
  currentOrganization: MockOrganization
  financialData: typeof MOCK_FINANCIAL_DATA
  businesses: MockBusiness[]
  accounts: MockAccount[]
  transactions: MockTransaction[]
  teamMembers: TeamMember[]
  userProfile: UserProfile
  loading: {
    wallet: boolean
    accounts: boolean
    businesses: boolean
    transactions: boolean
    team: boolean
    profile: boolean
  }
}

// Action types
type DemoAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof DemoState['loading']; value: boolean } }
  | { type: 'SWITCH_ORGANIZATION'; payload: string } // organization ID
  | { type: 'UPDATE_WALLET_BALANCE'; payload: { amount: number; type: 'add' | 'subtract' } }
  | { type: 'ADD_TRANSACTION'; payload: MockTransaction }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { accountId: number; amount: number; type: 'add' | 'subtract' } }
  | { type: 'CREATE_ACCOUNT'; payload: Omit<MockAccount, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_ACCOUNT'; payload: MockAccount }
  | { type: 'DELETE_ACCOUNT'; payload: number }
  | { type: 'PAUSE_ACCOUNT'; payload: number }
  | { type: 'RESUME_ACCOUNT'; payload: number }
  | { type: 'CREATE_BUSINESS'; payload: Omit<MockBusiness, 'id' | 'dateCreated' | 'accountsCount' | 'totalBalance' | 'totalSpend'> }
  | { type: 'UPDATE_BUSINESS'; payload: MockBusiness }
  | { type: 'DELETE_BUSINESS'; payload: string }
  | { type: 'APPROVE_BUSINESS'; payload: string }
  | { type: 'CONSOLIDATE_FUNDS'; payload: { sourceAccountIds: number[]; targetAccountId: number; amount: number } }
  | { type: 'CONSOLIDATE_TO_WALLET'; payload: { sourceAccountIds: number[]; amount: number } }
  | { type: 'DISTRIBUTE_FUNDS'; payload: { sourceAccountId: number; distributions: Array<{ accountId: number; amount: number }> } }
  | { type: 'DISTRIBUTE_FROM_WALLET'; payload: { distributions: Array<{ accountId: number; amount: number }> } }
  | { type: 'INVITE_TEAM_MEMBER'; payload: { email: string; role: TeamMember['role']; invitedBy: string } }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'REMOVE_TEAM_MEMBER'; payload: string }
  | { type: 'CHANGE_MEMBER_ROLE'; payload: { memberId: string; newRole: TeamMember['role'] } }
  | { type: 'RESEND_INVITATION'; payload: { email: string } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_ORGANIZATION'; payload: Partial<MockOrganization> }
  | { type: 'RESET_DEMO_DATA' }
  | { type: 'LOAD_PERSISTED_STATE'; payload: DemoState }

// Initial state
const initialState: DemoState = {
  organizations: [...MOCK_ORGANIZATIONS],
  currentOrganization: MOCK_ORGANIZATIONS[0],
  financialData: { ...MOCK_FINANCIAL_DATA },
  businesses: [...MOCK_BUSINESSES],
  accounts: [...MOCK_ACCOUNTS],
  transactions: [...MOCK_TRANSACTIONS],
  teamMembers: [...(MOCK_TEAM_MEMBERS_BY_ORG[MOCK_ORGANIZATIONS[0].id] || MOCK_TEAM_MEMBERS)],
  userProfile: { ...MOCK_USER_PROFILE },
  loading: {
    wallet: false,
    accounts: false,
    businesses: false,
    transactions: false,
    team: false,
    profile: false
  }
}

// Reducer
function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value
        }
      }

    case 'SWITCH_ORGANIZATION': {
      const organization = state.organizations.find(o => o.id === action.payload)
      if (organization) {
        // Load organization-specific data
        const orgBusinesses = MOCK_BUSINESSES_BY_ORG[organization.id] || []
        const orgFinancialData = MOCK_FINANCIAL_DATA_BY_ORG[organization.id] || MOCK_FINANCIAL_DATA
        const orgAccounts = MOCK_ACCOUNTS_BY_ORG[organization.id] || []
        const orgTransactions = MOCK_TRANSACTIONS_BY_ORG[organization.id] || []
        const orgTeamMembers = MOCK_TEAM_MEMBERS_BY_ORG[organization.id] || []
        
        return {
          ...state,
          currentOrganization: organization,
          businesses: orgBusinesses,
          financialData: orgFinancialData,
          accounts: orgAccounts,
          transactions: orgTransactions,
          teamMembers: orgTeamMembers
        }
      }
      return state
    }

    case 'UPDATE_WALLET_BALANCE': {
      const newBalance = action.payload.type === 'add' 
        ? state.financialData.walletBalance + action.payload.amount
        : state.financialData.walletBalance - action.payload.amount

      return {
        ...state,
        financialData: {
          ...state.financialData,
          walletBalance: Math.max(0, newBalance)
        }
      }
    }

    case 'ADD_TRANSACTION': {
      const newTransaction = {
        ...action.payload,
        id: Math.max(...state.transactions.map(t => t.id), 0) + 1,
        timestamp: new Date()
      }
      
      return {
        ...state,
        transactions: [newTransaction, ...state.transactions]
      }
    }

    case 'UPDATE_ACCOUNT_BALANCE': {
      const updatedAccounts = state.accounts.map(account => {
        if (account.id === action.payload.accountId) {
          const newBalance = action.payload.type === 'add'
            ? account.balance + action.payload.amount
            : account.balance - action.payload.amount
          
          return {
            ...account,
            balance: Math.max(0, newBalance)
          }
        }
        return account
      })

      // Update business total balances
      const updatedBusinesses = state.businesses.map(business => {
        const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
        const totalBalance = businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        
        return {
          ...business,
          totalBalance,
          accountsCount: businessAccounts.length
        }
      })

      return {
        ...state,
        accounts: updatedAccounts,
        businesses: updatedBusinesses
      }
    }

    case 'CREATE_ACCOUNT': {
      const newAccount: MockAccount = {
        ...action.payload,
        id: Math.max(...state.accounts.map(a => a.id), 0) + 1,
        dateAdded: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      }

      const updatedAccounts = [...state.accounts, newAccount]
      
      // Update business account count and total balance
      const updatedBusinesses = state.businesses.map(business => {
        if (business.name === newAccount.business) {
          const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
          return {
            ...business,
            accountsCount: businessAccounts.length,
            totalBalance: businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
          }
        }
        return business
      })

      return {
        ...state,
        accounts: updatedAccounts,
        businesses: updatedBusinesses
      }
    }

    case 'UPDATE_ACCOUNT': {
      const updatedAccounts = state.accounts.map(account =>
        account.id === action.payload.id ? action.payload : account
      )

      // Update business totals
      const updatedBusinesses = state.businesses.map(business => {
        const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
        return {
          ...business,
          totalBalance: businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        }
      })

      return {
        ...state,
        accounts: updatedAccounts,
        businesses: updatedBusinesses
      }
    }

    case 'DELETE_ACCOUNT': {
      const updatedAccounts = state.accounts.filter(account => account.id !== action.payload)
      
      // Update business account counts and balances
      const updatedBusinesses = state.businesses.map(business => {
        const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
        return {
          ...business,
          accountsCount: businessAccounts.length,
          totalBalance: businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        }
      })

      return {
        ...state,
        accounts: updatedAccounts,
        businesses: updatedBusinesses
      }
    }

    case 'PAUSE_ACCOUNT': {
      const updatedAccounts = state.accounts.map(account =>
        account.id === action.payload 
          ? { ...account, status: 'paused' as const }
          : account
      )

      return {
        ...state,
        accounts: updatedAccounts
      }
    }

    case 'RESUME_ACCOUNT': {
      const updatedAccounts = state.accounts.map(account =>
        account.id === action.payload 
          ? { ...account, status: 'active' as const }
          : account
      )

      return {
        ...state,
        accounts: updatedAccounts
      }
    }

    case 'CREATE_BUSINESS': {
      const newBusiness: MockBusiness = {
        ...action.payload,
        id: (Math.max(...state.businesses.map(b => parseInt(b.id)), 0) + 1).toString(),
        dateCreated: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        accountsCount: 0,
        totalBalance: 0,
        totalSpend: 0
      }

      return {
        ...state,
        businesses: [...state.businesses, newBusiness]
      }
    }

    case 'UPDATE_BUSINESS': {
      const updatedBusinesses = state.businesses.map(business =>
        business.id === action.payload.id ? action.payload : business
      )

      // Update accounts that reference this business
      const updatedAccounts = state.accounts.map(account => {
        const updatedBusiness = updatedBusinesses.find(b => b.name === account.business)
        if (updatedBusiness && updatedBusiness.name !== action.payload.name) {
          return { ...account, business: action.payload.name }
        }
        return account
      })

      return {
        ...state,
        businesses: updatedBusinesses,
        accounts: updatedAccounts
      }
    }

    case 'DELETE_BUSINESS': {
      const businessToDelete = state.businesses.find(b => b.id === action.payload)
      if (!businessToDelete) return state

      // Remove business and its accounts
      const updatedBusinesses = state.businesses.filter(business => business.id !== action.payload)
      const updatedAccounts = state.accounts.filter(account => account.business !== businessToDelete.name)

      return {
        ...state,
        businesses: updatedBusinesses,
        accounts: updatedAccounts
      }
    }

    case 'APPROVE_BUSINESS': {
      const updatedBusinesses = state.businesses.map(business => {
        if (business.id === action.payload) {
          // Generate BM ID for approved business
          const bmId = `${Math.floor(Math.random() * 9000000000000000) + 1000000000000000}`
          return {
            ...business,
            status: 'active' as const,
            bmId
          }
        }
        return business
      })

      return {
        ...state,
        businesses: updatedBusinesses
      }
    }

    case 'CONSOLIDATE_FUNDS': {
      const { sourceAccountIds, targetAccountId, amount } = action.payload
      
      // Calculate amount to take from each source account
      const sourceAccounts = state.accounts.filter(acc => sourceAccountIds.includes(acc.id))
      const totalSourceBalance = sourceAccounts.reduce((sum, acc) => sum + acc.balance, 0)
      
      if (totalSourceBalance < amount) {
        toast.error('Insufficient funds to consolidate')
        return state
      }

      const updatedAccounts = state.accounts.map(account => {
        if (sourceAccountIds.includes(account.id)) {
          // Proportionally reduce balance from source accounts
          const proportion = account.balance / totalSourceBalance
          const amountToReduce = amount * proportion
          return {
            ...account,
            balance: Math.max(0, account.balance - amountToReduce)
          }
        } else if (account.id === targetAccountId) {
          // Add to target account
          return {
            ...account,
            balance: account.balance + amount
          }
        }
        return account
      })

      // Add transaction
      const newTransaction: MockTransaction = {
        id: Math.max(...state.transactions.map(t => t.id), 0) + 1,
        name: 'Funds Consolidation',
        amount: amount,
        type: 'deposit',
        date: 'Consolidation',
        account: updatedAccounts.find(acc => acc.id === targetAccountId)?.name || 'Unknown',
        timestamp: new Date()
      }

      return {
        ...state,
        accounts: updatedAccounts,
        transactions: [newTransaction, ...state.transactions]
      }
    }

    case 'CONSOLIDATE_TO_WALLET': {
      const { sourceAccountIds, amount } = action.payload
      
      // Calculate amount to take from each source account
      const sourceAccounts = state.accounts.filter(acc => sourceAccountIds.includes(acc.id))
      const totalSourceBalance = sourceAccounts.reduce((sum, acc) => sum + acc.balance, 0)
      
      if (totalSourceBalance < amount) {
        toast.error('Insufficient funds to consolidate')
        return state
      }

      const updatedAccounts = state.accounts.map(account => {
        if (sourceAccountIds.includes(account.id)) {
          // Proportionally reduce balance from source accounts
          const proportion = account.balance / totalSourceBalance
          const amountToReduce = amount * proportion
          return {
            ...account,
            balance: Math.max(0, account.balance - amountToReduce)
          }
        }
        return account
      })

      // Update business total balances
      const updatedBusinesses = state.businesses.map(business => {
        const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
        const totalBalance = businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        
        return {
          ...business,
          totalBalance,
          accountsCount: businessAccounts.length
        }
      })

      // Add transaction
      const newTransaction: MockTransaction = {
        id: Math.max(...state.transactions.map(t => t.id), 0) + 1,
        name: 'Funds Consolidation',
        amount: amount,
        type: 'deposit',
        date: 'Consolidation',
        account: 'Main Wallet',
        timestamp: new Date()
      }

      return {
        ...state,
        financialData: {
          ...state.financialData,
          walletBalance: state.financialData.walletBalance + amount
        },
        accounts: updatedAccounts,
        businesses: updatedBusinesses,
        transactions: [newTransaction, ...state.transactions]
      }
    }

    case 'DISTRIBUTE_FUNDS': {
      const { sourceAccountId, distributions } = action.payload
      const totalDistribution = distributions.reduce((sum, dist) => sum + dist.amount, 0)
      
      const sourceAccount = state.accounts.find(acc => acc.id === sourceAccountId)
      if (!sourceAccount || sourceAccount.balance < totalDistribution) {
        toast.error('Insufficient funds to distribute')
        return state
      }

      const updatedAccounts = state.accounts.map(account => {
        if (account.id === sourceAccountId) {
          return {
            ...account,
            balance: account.balance - totalDistribution
          }
        }
        
        const distribution = distributions.find(dist => dist.accountId === account.id)
        if (distribution) {
          return {
            ...account,
            balance: account.balance + distribution.amount
          }
        }
        
        return account
      })

      // Add transaction
      const newTransaction: MockTransaction = {
        id: Math.max(...state.transactions.map(t => t.id), 0) + 1,
        name: 'Funds Distribution',
        amount: -totalDistribution,
        type: 'withdrawal',
        date: 'Distribution',
        account: sourceAccount.name,
        timestamp: new Date()
      }

      return {
        ...state,
        accounts: updatedAccounts,
        transactions: [newTransaction, ...state.transactions]
      }
    }

    case 'DISTRIBUTE_FROM_WALLET': {
      const { distributions } = action.payload
      const totalDistribution = distributions.reduce((sum, dist) => sum + dist.amount, 0)
      
      if (state.financialData.walletBalance < totalDistribution) {
        toast.error('Insufficient funds to distribute')
        return state
      }

      const updatedAccounts = state.accounts.map(account => {
        const distribution = distributions.find(dist => dist.accountId === account.id)
        if (distribution) {
          return {
            ...account,
            balance: account.balance + distribution.amount
          }
        }
        
        return account
      })

      // Update business total balances
      const updatedBusinesses = state.businesses.map(business => {
        const businessAccounts = updatedAccounts.filter(acc => acc.business === business.name)
        const totalBalance = businessAccounts.reduce((sum, acc) => sum + acc.balance, 0)
        
        return {
          ...business,
          totalBalance,
          accountsCount: businessAccounts.length
        }
      })

      // Add transaction
      const newTransaction: MockTransaction = {
        id: Math.max(...state.transactions.map(t => t.id), 0) + 1,
        name: 'Funds Distribution',
        amount: -totalDistribution,
        type: 'withdrawal',
        date: 'Distribution',
        account: 'Main Wallet',
        timestamp: new Date()
      }

      return {
        ...state,
        financialData: {
          ...state.financialData,
          walletBalance: state.financialData.walletBalance - totalDistribution
        },
        accounts: updatedAccounts,
        businesses: updatedBusinesses,
        transactions: [newTransaction, ...state.transactions]
      }
    }

    case 'INVITE_TEAM_MEMBER': {
      const { email, role, invitedBy } = action.payload
      const newMember: TeamMember = {
        id: (Math.max(...state.teamMembers.map(m => parseInt(m.id)), 0) + 1).toString(),
        name: '',
        email,
        role,
        status: 'pending',
        joined: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        signInCount: 0,
        authentication: '',
        permissions: {
          canManageTeam: false,
          canManageBusinesses: false,
          canManageAccounts: false,
          canManageWallet: false,
          canViewAnalytics: false
        }
      }
      return {
        ...state,
        teamMembers: [...state.teamMembers, newMember]
      }
    }

    case 'UPDATE_TEAM_MEMBER': {
      const updatedMembers = state.teamMembers.map(member =>
        member.id === action.payload.id ? action.payload : member
      )
      return {
        ...state,
        teamMembers: updatedMembers
      }
    }

    case 'REMOVE_TEAM_MEMBER': {
      const updatedMembers = state.teamMembers.filter(member => member.id !== action.payload)
      return {
        ...state,
        teamMembers: updatedMembers
      }
    }

    case 'CHANGE_MEMBER_ROLE': {
      const { memberId, newRole } = action.payload
      const updatedMembers = state.teamMembers.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
      return {
        ...state,
        teamMembers: updatedMembers
      }
    }

    case 'RESEND_INVITATION': {
      const { email } = action.payload
      const updatedMembers = state.teamMembers.map(member =>
        member.email === email ? { ...member, status: 'pending' as const } : member
      )
      return {
        ...state,
        teamMembers: updatedMembers
      }
    }

    case 'UPDATE_USER_PROFILE': {
      const updatedProfile = { ...state.userProfile, ...action.payload }
      return {
        ...state,
        userProfile: updatedProfile
      }
    }

    case 'UPDATE_ORGANIZATION': {
      const updatedOrganization = { ...state.currentOrganization, ...action.payload }
      return {
        ...state,
        currentOrganization: updatedOrganization
      }
    }

    case 'RESET_DEMO_DATA':
      return { ...initialState }

    case 'LOAD_PERSISTED_STATE':
      return action.payload

    default:
      return state
  }
}

// Context
interface DemoContextType {
  state: DemoState
  dispatch: React.Dispatch<DemoAction>
  // Helper functions
  fundWallet: (amount: number, method: string) => Promise<void>
  withdrawFromWallet: (amount: number, method: string) => Promise<void>
  topUpAccount: (accountId: number, amount: number) => Promise<void>
  createAccount: (accountData: Omit<MockAccount, 'id' | 'dateAdded'>) => Promise<void>
  updateAccount: (account: MockAccount) => Promise<void>
  deleteAccount: (accountId: number) => Promise<void>
  pauseAccount: (accountId: number) => Promise<void>
  resumeAccount: (accountId: number) => Promise<void>
  createBusiness: (businessData: Omit<MockBusiness, 'id' | 'dateCreated' | 'accountsCount' | 'totalBalance' | 'totalSpend'>) => Promise<void>
  updateBusiness: (business: MockBusiness) => Promise<void>
  deleteBusiness: (businessId: string) => Promise<void>
  approveBusiness: (businessId: string) => Promise<void>
  consolidateFunds: (sourceAccountIds: number[], targetAccountId: number, amount: number) => Promise<void>
  consolidateToWallet: (sourceAccountIds: number[], amount: number) => Promise<void>
  distributeFunds: (sourceAccountId: number, distributions: Array<{ accountId: number; amount: number }>) => Promise<void>
  distributeFromWallet: (distributions: Array<{ accountId: number; amount: number }>) => Promise<void>
  inviteTeamMember: (email: string, role: TeamMember['role'], invitedBy: string) => Promise<void>
  updateTeamMember: (member: TeamMember) => Promise<void>
  removeTeamMember: (memberId: string) => void
  changeMemberRole: (memberId: string, newRole: TeamMember['role']) => void
  resendInvitation: (email: string) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
  updateOrganization: (organization: Partial<MockOrganization>) => void
  switchOrganization: (organizationId: string) => void
  resetDemoData: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

// Provider
interface DemoProviderProps {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [state, dispatch] = useReducer(demoReducer, initialState)

  // Persist state to localStorage
  useEffect(() => {
    const persistedState = localStorage.getItem('adhub-demo-state')
    if (persistedState) {
      try {
        const parsed = JSON.parse(persistedState)
        dispatch({ type: 'LOAD_PERSISTED_STATE', payload: parsed })
      } catch (error) {
        console.warn('Failed to load persisted state:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('adhub-demo-state', JSON.stringify(state))
  }, [state])

  // Helper functions
  const fundWallet = async (amount: number, method: string) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'wallet', value: true } })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: { amount, type: 'add' } })
    dispatch({ type: 'ADD_TRANSACTION', payload: {
      id: 0, // Will be set by reducer
      name: 'Wallet',
      amount: amount,
      type: 'deposit',
      date: `Deposit via ${method}`,
      account: 'Main Wallet',
      timestamp: new Date()
    }})
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'wallet', value: false } })
    toast.success(`Successfully added $${amount.toLocaleString()} to your wallet`)
  }

  const withdrawFromWallet = async (amount: number, method: string) => {
    if (state.financialData.walletBalance < amount) {
      toast.error('Insufficient funds for withdrawal')
      return
    }

    dispatch({ type: 'SET_LOADING', payload: { key: 'wallet', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: { amount, type: 'subtract' } })
    dispatch({ type: 'ADD_TRANSACTION', payload: {
      id: 0,
      name: 'Wallet',
      amount: -amount,
      type: 'withdrawal',
      date: `Withdrawal via ${method}`,
      account: 'Main Wallet',
      timestamp: new Date()
    }})
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'wallet', value: false } })
    toast.success(`Successfully withdrew $${amount.toLocaleString()} from your wallet`)
  }

  const topUpAccount = async (accountId: number, amount: number) => {
    if (state.financialData.walletBalance < amount) {
      toast.error('Insufficient wallet balance for top-up')
      return
    }

    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Subtract from wallet
    dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: { amount, type: 'subtract' } })
    // Add to account
    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId, amount, type: 'add' } })
    
    const account = state.accounts.find(acc => acc.id === accountId)
    dispatch({ type: 'ADD_TRANSACTION', payload: {
      id: 0,
      name: 'Ad Spend',
      amount: -amount,
      type: 'spend',
      date: 'Ad Account Top-up',
      account: account?.name || 'Unknown Account',
      timestamp: new Date()
    }})
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully topped up ${account?.name} with $${amount.toLocaleString()}`)
  }

  const createAccount = async (accountData: Omit<MockAccount, 'id' | 'dateAdded'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch({ type: 'CREATE_ACCOUNT', payload: accountData })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully created account: ${accountData.name}`)
  }

  const updateAccount = async (account: MockAccount) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'UPDATE_ACCOUNT', payload: account })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully updated account: ${account.name}`)
  }

  const deleteAccount = async (accountId: number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const account = state.accounts.find(acc => acc.id === accountId)
    dispatch({ type: 'DELETE_ACCOUNT', payload: accountId })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully deleted account: ${account?.name}`)
  }

  const pauseAccount = async (accountId: number) => {
    const account = state.accounts.find(acc => acc.id === accountId)
    dispatch({ type: 'PAUSE_ACCOUNT', payload: accountId })
    toast.success(`Paused account: ${account?.name}`)
  }

  const resumeAccount = async (accountId: number) => {
    const account = state.accounts.find(acc => acc.id === accountId)
    dispatch({ type: 'RESUME_ACCOUNT', payload: accountId })
    toast.success(`Resumed account: ${account?.name}`)
  }

  const createBusiness = async (businessData: Omit<MockBusiness, 'id' | 'dateCreated' | 'accountsCount' | 'totalBalance' | 'totalSpend'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dispatch({ type: 'CREATE_BUSINESS', payload: businessData })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    toast.success(`Successfully created business: ${businessData.name}`)
  }

  const updateBusiness = async (business: MockBusiness) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'UPDATE_BUSINESS', payload: business })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    toast.success(`Successfully updated business: ${business.name}`)
  }

  const deleteBusiness = async (businessId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const business = state.businesses.find(b => b.id === businessId)
    dispatch({ type: 'DELETE_BUSINESS', payload: businessId })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    toast.success(`Successfully deleted business: ${business?.name}`)
  }

  const approveBusiness = async (businessId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const business = state.businesses.find(b => b.id === businessId)
    dispatch({ type: 'APPROVE_BUSINESS', payload: businessId })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    toast.success(`Successfully approved business: ${business?.name}`)
  }

  const consolidateFunds = async (sourceAccountIds: number[], targetAccountId: number, amount: number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dispatch({ type: 'CONSOLIDATE_FUNDS', payload: { sourceAccountIds, targetAccountId, amount } })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully consolidated $${amount.toLocaleString()} to target account`)
  }

  const consolidateToWallet = async (sourceAccountIds: number[], amount: number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dispatch({ type: 'CONSOLIDATE_TO_WALLET', payload: { sourceAccountIds, amount } })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully consolidated $${amount.toLocaleString()} to wallet`)
  }

  const distributeFunds = async (sourceAccountId: number, distributions: Array<{ accountId: number; amount: number }>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dispatch({ type: 'DISTRIBUTE_FUNDS', payload: { sourceAccountId, distributions } })
    
    const totalAmount = distributions.reduce((sum, dist) => sum + dist.amount, 0)
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully distributed $${totalAmount.toLocaleString()} across ${distributions.length} accounts`)
  }

  const distributeFromWallet = async (distributions: Array<{ accountId: number; amount: number }>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dispatch({ type: 'DISTRIBUTE_FROM_WALLET', payload: { distributions } })
    
    const totalAmount = distributions.reduce((sum, dist) => sum + dist.amount, 0)
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    toast.success(`Successfully distributed $${totalAmount.toLocaleString()} from wallet`)
  }

  const inviteTeamMember = async (email: string, role: TeamMember['role'], invitedBy: string) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'team', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch({ type: 'INVITE_TEAM_MEMBER', payload: { email, role, invitedBy } })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'team', value: false } })
    toast.success(`Successfully invited team member to email: ${email}`)
  }

  const updateTeamMember = async (member: TeamMember) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'team', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: member })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'team', value: false } })
    toast.success(`Successfully updated team member: ${member.name}`)
  }

  const removeTeamMember = (memberId: string) => {
    dispatch({ type: 'REMOVE_TEAM_MEMBER', payload: memberId })
    toast.success(`Successfully removed team member with ID: ${memberId}`)
  }

  const changeMemberRole = (memberId: string, newRole: TeamMember['role']) => {
    dispatch({ type: 'CHANGE_MEMBER_ROLE', payload: { memberId, newRole } })
    toast.success(`Successfully changed role for team member with ID: ${memberId} to ${newRole}`)
  }

  const resendInvitation = (email: string) => {
    dispatch({ type: 'RESEND_INVITATION', payload: { email } })
    toast.success(`Successfully resent invitation to email: ${email}`)
  }

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: profile })
    toast.success(`Successfully updated user profile`)
  }

  const updateOrganization = (organization: Partial<MockOrganization>) => {
    dispatch({ type: 'UPDATE_ORGANIZATION', payload: organization })
    toast.success(`Successfully updated organization`)
  }

  const switchOrganization = (organizationId: string) => {
    const org = state.organizations.find(o => o.id === organizationId)
    dispatch({ type: 'SWITCH_ORGANIZATION', payload: organizationId })
    if (org) {
      toast.success(`Switched to ${org.name}`)
    }
  }

  const resetDemoData = () => {
    dispatch({ type: 'RESET_DEMO_DATA' })
    localStorage.removeItem('adhub-demo-state')
    toast.success('Demo data has been reset')
  }

  const value: DemoContextType = {
    state,
    dispatch,
    fundWallet,
    withdrawFromWallet,
    topUpAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    pauseAccount,
    resumeAccount,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    approveBusiness,
    consolidateFunds,
    consolidateToWallet,
    distributeFunds,
    distributeFromWallet,
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
    changeMemberRole,
    resendInvitation,
    updateUserProfile,
    updateOrganization,
    switchOrganization,
    resetDemoData
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

// Hook
export function useDemoState() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoState must be used within a DemoProvider')
  }
  return context
} 