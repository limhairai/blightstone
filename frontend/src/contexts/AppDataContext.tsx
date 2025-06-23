"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { USE_DEMO_DATA } from '../lib/env-config'
import { 
  APP_FINANCIAL_DATA, 
  APP_BUSINESSES, 
  APP_ACCOUNTS, 
  APP_TRANSACTIONS,
  APP_ORGANIZATIONS,
  APP_BUSINESSES_BY_ORG,
  APP_FINANCIAL_DATA_BY_ORG,
  APP_ACCOUNTS_BY_ORG,
  APP_TRANSACTIONS_BY_ORG,
  MOCK_TEAM_MEMBERS_BY_ORG
} from '../lib/mock-data'
import { toast } from 'sonner'

// Interfaces
export interface AppBusiness {
  id: string | number
  name: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'ready' | 'provisioning' | 'active' | 'paused' | 'suspended'
  balance: number
  dateCreated: string
  revenue?: number
  spend?: number
  type?: string
  website?: string
  description?: string
  logo?: string
  accountsCount?: number
  totalBalance?: number
  totalSpend?: number
  monthlyQuota?: number
  bmId?: string
  businessType?: string
  industry?: string
  domains?: Array<{ domain: string; verified: boolean }>
  verification?: 'pending' | 'verified' | 'rejected'
  reviewNotes?: string
  rejectionReason?: string
}

export interface AppAccount {
  id: string | number
  name: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'active' | 'paused' | 'suspended' | 'disabled' | 'idle' | 'archived'
  balance: number
  dateAdded: string
  spend?: number
  revenue?: number
  businessId?: string | number
  business?: string
  adAccount?: string
  spendLimit?: number
  quota?: number
  spent?: number
  platform?: 'Meta' | 'Google' | 'TikTok' | 'LinkedIn' | 'Facebook'
  timezone?: string
  accountId?: string
}

export interface AppTransaction {
  id: string | number
  type: 'topup' | 'withdrawal' | 'transfer' | 'spend'
  amount: number
  date: string
  description: string
  status: 'completed' | 'pending' | 'failed'
  fromAccount?: string
  toAccount?: string
  name?: string
  account?: string
  timestamp?: Date | string
  reference?: string
  paymentMethod?: string
  fee?: number
  netAmount?: number
}

export interface AppOrganization {
  id: string
  name: string
  plan: string
  balance: number
  created_at: string
  verification_status?: 'pending' | 'verified' | 'rejected'
  avatar?: string
}

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

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  timezone: string
  language: string
  role?: string
  is_superuser?: boolean
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export interface AppState {
  dataSource: 'demo' | 'supabase'
  userRole: 'client' | 'admin' | 'superuser'
  businesses: AppBusiness[]
  accounts: AppAccount[]
  transactions: AppTransaction[]
  organizations: AppOrganization[]
  currentOrganization: AppOrganization | null
  teamMembers: TeamMember[]
  adminData: {
    allBusinesses: AppBusiness[]
    allAccounts: AppAccount[]
    allTransactions: AppTransaction[]
    allOrganizations: AppOrganization[]
    pendingApplications: AppBusiness[]
    systemStats: {
      totalOrganizations: number
      activeTeams: number
      pendingApplications: number
      monthlyRevenue: number
    }
  }
  userProfile: UserProfile | null
  financialData: {
    totalBalance: number
    totalRevenue: number
    totalSpend: number
    monthlyRevenue: number
    monthlySpend: number
    growthRate: number
  }
  loading: {
    businesses: boolean
    accounts: boolean
    transactions: boolean
    organizations: boolean
    teamMembers: boolean
    actions: boolean
  }
  setupProgress: {
    emailVerified: boolean
    organizationCreated: boolean
    firstBusinessAdded: boolean
    firstAccountConnected: boolean
    firstTopUp: boolean
  }
}

type AppAction = 
  | { type: 'SET_DATA_SOURCE'; payload: 'demo' | 'supabase' }
  | { type: 'SET_USER_ROLE'; payload: 'client' | 'admin' | 'superuser' }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_BUSINESSES'; payload: AppBusiness[] }
  | { type: 'SET_ACCOUNTS'; payload: AppAccount[] }
  | { type: 'SET_TRANSACTIONS'; payload: AppTransaction[] }
  | { type: 'SET_ORGANIZATIONS'; payload: AppOrganization[] }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: AppOrganization | null }
  | { type: 'SET_TEAM_MEMBERS'; payload: TeamMember[] }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_FINANCIAL_DATA'; payload: Partial<AppState['financialData']> }
  | { type: 'SET_ADMIN_DATA'; payload: Partial<AppState['adminData']> }
  | { type: 'CREATE_BUSINESS'; payload: Omit<AppBusiness, 'id' | 'dateCreated'> }
  | { type: 'UPDATE_BUSINESS'; payload: AppBusiness }
  | { type: 'DELETE_BUSINESS'; payload: string | number }
  | { type: 'CREATE_ACCOUNT'; payload: Omit<AppAccount, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_ACCOUNT'; payload: AppAccount }
  | { type: 'DELETE_ACCOUNT'; payload: string | number }
  | { type: 'ADD_TRANSACTION'; payload: Omit<AppTransaction, 'id'> }
  | { type: 'UPDATE_WALLET_BALANCE'; payload: { amount: number; type: 'add' | 'subtract' } }
  | { type: 'UPDATE_SETUP_PROGRESS'; payload: Partial<AppState['setupProgress']> }
  | { type: 'RESET_DATA' }

interface AppDataContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  createBusiness: (data: Omit<AppBusiness, 'id' | 'dateCreated'>) => Promise<void>
  updateBusiness: (business: AppBusiness) => Promise<void>
  deleteBusiness: (id: string | number) => Promise<void>
  createAccount: (data: Omit<AppAccount, 'id' | 'dateAdded'>) => Promise<void>
  updateAccount: (account: AppAccount) => Promise<void>
  deleteAccount: (id: string | number) => Promise<void>
  addTransaction: (data: Omit<AppTransaction, 'id'>) => Promise<void>
  updateWalletBalance: (amount: number, type: 'add' | 'subtract') => Promise<void>
  distributeFunds: (distributions: Array<{ accountId: number; amount: number }>) => Promise<void>
  consolidateFunds: (accountIds: number[]) => Promise<void>
  switchOrganization: (orgId: string) => void
  createOrganization: (data: Omit<AppOrganization, 'id' | 'created_at'>) => Promise<void>
  adminApproveBusiness: (businessId: string | number, orgId: string) => Promise<void>
  adminAssignAccount: (accountId: string | number, businessId: string | number) => Promise<void>
  adminGetAllData: () => Promise<void>
  adminUpdateSystemStats: (stats: Partial<AppState['adminData']['systemStats']>) => void
  refreshData: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

const initialState: AppState = {
  dataSource: USE_DEMO_DATA ? 'demo' : 'supabase',
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
    totalBalance: 0,
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

function appDataReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA_SOURCE':
      return { ...state, dataSource: action.payload }
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload }
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      }
    case 'SET_BUSINESSES':
      return { ...state, businesses: action.payload }
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload }
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload }
    case 'SET_CURRENT_ORGANIZATION':
      return { ...state, currentOrganization: action.payload }
    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload }
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload }
    case 'SET_FINANCIAL_DATA':
      return {
        ...state,
        financialData: { ...state.financialData, ...action.payload }
      }
    case 'SET_ADMIN_DATA':
      return {
        ...state,
        adminData: { ...state.adminData, ...action.payload }
      }
    case 'CREATE_BUSINESS':
      const newBusiness: AppBusiness = {
        ...action.payload,
        id: Date.now().toString(),
        dateCreated: new Date().toISOString()
      }
      return {
        ...state,
        businesses: [...state.businesses, newBusiness]
      }
    case 'UPDATE_WALLET_BALANCE':
      const { amount, type } = action.payload
      const currentBalance = state.financialData.totalBalance
      const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount
      
      return {
        ...state,
        financialData: {
          ...state.financialData,
          totalBalance: Math.max(0, newBalance)
        }
      }
    case 'ADD_TRANSACTION':
      const newTransaction: AppTransaction = {
        ...action.payload,
        id: Date.now().toString()
      }
      return {
        ...state,
        transactions: [...state.transactions, newTransaction]
      }
    case 'UPDATE_SETUP_PROGRESS':
      return {
        ...state,
        setupProgress: { ...state.setupProgress, ...action.payload }
      }
    default:
      return state
  }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, initialState)
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      if (state.dataSource === 'demo') {
        const orgId = state.currentOrganization?.id || 'org1'
        
        dispatch({ type: 'SET_ORGANIZATIONS', payload: APP_ORGANIZATIONS as any })
        dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: APP_ORGANIZATIONS[0] as any })
        dispatch({ type: 'SET_BUSINESSES', payload: APP_BUSINESSES_BY_ORG[orgId] || [] })
        dispatch({ type: 'SET_ACCOUNTS', payload: APP_ACCOUNTS_BY_ORG[orgId] || [] })
        dispatch({ type: 'SET_TRANSACTIONS', payload: APP_TRANSACTIONS_BY_ORG[orgId] || [] })
        dispatch({ type: 'SET_TEAM_MEMBERS', payload: MOCK_TEAM_MEMBERS_BY_ORG[orgId] || [] })
        dispatch({ type: 'SET_FINANCIAL_DATA', payload: (APP_FINANCIAL_DATA_BY_ORG[orgId] || APP_FINANCIAL_DATA) as any })
        
        dispatch({ type: 'SET_USER_PROFILE', payload: {
          id: 'demo-user-123',
          name: 'Demo Admin',
          email: 'admin@adhub.tech',
          timezone: 'UTC',
          language: 'en',
          notifications: { email: true, push: true, sms: false }
        }})
        
        dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: {
          emailVerified: true,
          organizationCreated: true,
          firstBusinessAdded: true,
          firstAccountConnected: true,
          firstTopUp: true
        }})
      } else {
        // ✅ PRODUCTION: Load real data from Supabase
        console.log('🔗 Loading production data from Supabase...')
        try {
          const { BusinessService, AccountService, TransactionService, OrganizationService, TeamService, UserService } = await import('../services/supabase-service')
          
          // Load user profile
          if (user?.id) {
            const userProfile = await UserService.getUserProfile(user.id)
            if (userProfile) {
              dispatch({ type: 'SET_USER_PROFILE', payload: userProfile })
            }
          }
          
          // Load organizations for user
          if (user?.id) {
            const organizations = await OrganizationService.getOrganizationsByUser(user.id)
            dispatch({ type: 'SET_ORGANIZATIONS', payload: organizations })
            
            // Set current organization (first one or existing)
            const currentOrg = state.currentOrganization || organizations[0]
            if (currentOrg) {
              dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: currentOrg })
              
              // Load organization-specific data
              const [businesses, accounts, transactions, teamMembers] = await Promise.all([
                BusinessService.getBusinessesByOrganization(currentOrg.id),
                AccountService.getAccountsByOrganization(currentOrg.id),
                TransactionService.getTransactionsByOrganization(currentOrg.id),
                TeamService.getTeamMembersByOrganization(currentOrg.id)
              ])
              
              dispatch({ type: 'SET_BUSINESSES', payload: businesses })
              dispatch({ type: 'SET_ACCOUNTS', payload: accounts })
              dispatch({ type: 'SET_TRANSACTIONS', payload: transactions })
              dispatch({ type: 'SET_TEAM_MEMBERS', payload: teamMembers })
              
              // Calculate financial data from real transactions
              const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
              const totalSpend = transactions
                .filter(t => t.type === 'spend')
                .reduce((sum, t) => sum + t.amount, 0)
              const totalRevenue = transactions
                .filter(t => t.type === 'revenue')
                .reduce((sum, t) => sum + t.amount, 0)
              
              dispatch({ type: 'SET_FINANCIAL_DATA', payload: {
                totalBalance,
                totalRevenue,
                totalSpend,
                monthlyRevenue: 0, // TODO: Calculate from recent transactions
                monthlySpend: 0,   // TODO: Calculate from recent transactions
                growthRate: 0      // TODO: Calculate growth rate
              }})
              
              // Load onboarding progress
              const progress = await UserService.getOnboardingProgress(user.id)
              dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: progress })
            }
          }
        } catch (error) {
          console.error('Failed to load production data:', error)
          // Fallback to demo data on error
          console.log('🔄 Falling back to demo data due to error')
          const orgId = 'org1'
          dispatch({ type: 'SET_ORGANIZATIONS', payload: APP_ORGANIZATIONS as any })
          dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: APP_ORGANIZATIONS[0] as any })
          dispatch({ type: 'SET_BUSINESSES', payload: APP_BUSINESSES_BY_ORG[orgId] || [] })
          dispatch({ type: 'SET_ACCOUNTS', payload: APP_ACCOUNTS_BY_ORG[orgId] || [] })
          dispatch({ type: 'SET_TRANSACTIONS', payload: APP_TRANSACTIONS_BY_ORG[orgId] || [] })
          dispatch({ type: 'SET_TEAM_MEMBERS', payload: MOCK_TEAM_MEMBERS_BY_ORG[orgId] || [] })
          dispatch({ type: 'SET_FINANCIAL_DATA', payload: (APP_FINANCIAL_DATA_BY_ORG[orgId] || APP_FINANCIAL_DATA) as any })
        }
      }
    }

    loadData()
  }, [state.dataSource, state.currentOrganization?.id, user])

  const createBusiness = async (data: Omit<AppBusiness, 'id' | 'dateCreated'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      dispatch({ type: 'CREATE_BUSINESS', payload: data })
      toast.success(`Successfully created business: ${data.name}`)
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error('Failed to create business. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }

  const updateWalletBalance = async (amount: number, type: 'add' | 'subtract') => {
    dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: { amount, type } })
    
    const transaction: Omit<AppTransaction, 'id'> = {
      type: type === 'add' ? 'topup' : 'withdrawal',
      amount,
      date: new Date().toISOString(),
      description: type === 'add' ? 'Wallet top-up' : 'Wallet withdrawal',
      status: 'completed'
    }
    
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction })
    toast.success(`Wallet ${type === 'add' ? 'topped up' : 'debited'} with $${amount.toFixed(2)}`)
  }

  const contextValue: AppDataContextType = {
    state,
    dispatch,
    createBusiness,
    updateBusiness: async () => {},
    deleteBusiness: async () => {},
    createAccount: async () => {},
    updateAccount: async () => {},
    deleteAccount: async () => {},
    addTransaction: async () => {},
    updateWalletBalance,
    distributeFunds: async () => {},
    consolidateFunds: async () => {},
    switchOrganization: () => {},
    createOrganization: async () => {},
    adminApproveBusiness: async () => {},
    adminAssignAccount: async () => {},
    adminGetAllData: async () => {},
    adminUpdateSystemStats: () => {},
    refreshData: async () => {}
  }

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    if (typeof window === 'undefined') {
      return {
        state: initialState,
        dispatch: () => {},
        createBusiness: async () => {},
        updateBusiness: async () => {},
        deleteBusiness: async () => {},
        createAccount: async () => {},
        updateAccount: async () => {},
        deleteAccount: async () => {},
        addTransaction: async () => {},
        updateWalletBalance: async () => {},
        distributeFunds: async () => {},
        consolidateFunds: async () => {},
        switchOrganization: () => {},
        createOrganization: async () => {},
        adminApproveBusiness: async () => {},
        adminAssignAccount: async () => {},
        adminGetAllData: async () => {},
        adminUpdateSystemStats: () => {},
        refreshData: async () => {}
      } as AppDataContextType
    }
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}

export function useSuperuser() {
  const { state } = useAppData()
  return {
    isSuperuser: state.userRole === 'superuser',
    isAdmin: state.userRole === 'admin' || state.userRole === 'superuser',
    userRole: state.userRole,
    loading: state.loading.organizations || state.loading.businesses,
    error: null,
    refreshStatus: () => {}
  }
}

export function useAdAccounts() {
  const { state } = useAppData()
  return {
    adAccounts: state.accounts,
    loading: state.loading.accounts,
    error: null
  }
}

export function useWallet() {
  const { state, updateWalletBalance } = useAppData()
  return {
    balance: state.financialData.totalBalance,
    loading: state.loading.actions,
    error: null,
    topUp: updateWalletBalance
  }
}
