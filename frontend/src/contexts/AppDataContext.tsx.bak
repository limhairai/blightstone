"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getCurrentDataSource } from '../lib/env-config'
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
import { 
  BusinessService, 
  AccountService, 
  TransactionService, 
  OrganizationService, 
  TeamService, 
  UserService 
} from '../services/supabase-service'
import { toast } from 'sonner'

// Unified interfaces that work with both demo and production data
export interface AppBusiness {
  id: string | number
  name: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'ready' | 'provisioning' | 'active' | 'paused' | 'suspended'
  balance: number
  dateCreated: string
  
  // Extended properties (rich data from demo mode)
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
  
  // Extended properties (rich data from demo mode)
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
  
  // Extended properties (rich data from demo mode)
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

// Main app state
export interface AppState {
  // Data source
  dataSource: 'demo' | 'supabase'
  
  // User context
  userRole: 'client' | 'admin' | 'superuser'
  
  // Core data (admin sees all, client sees filtered)
  businesses: AppBusiness[]
  accounts: AppAccount[]
  transactions: AppTransaction[]
  organizations: AppOrganization[]
  currentOrganization: AppOrganization | null
  teamMembers: TeamMember[]
  
  // Admin-specific data (only populated for admin users)
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
  
  // User data
  userProfile: UserProfile | null
  
  // Financial data (organization-specific for clients, global for admin)
  financialData: {
    totalBalance: number
    totalRevenue: number
    totalSpend: number
    monthlyRevenue: number
    monthlySpend: number
    growthRate: number
  }
  
  // UI state
  loading: {
    businesses: boolean
    accounts: boolean
    transactions: boolean
    organizations: boolean
    teamMembers: boolean
    actions: boolean
  }
  
  // Setup progress
  setupProgress: {
    emailVerified: boolean
    organizationCreated: boolean
    firstBusinessAdded: boolean
    firstAccountConnected: boolean
    firstTopUp: boolean
  }
}

// Action types
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
  | { type: 'DISTRIBUTE_FUNDS'; payload: { distributions: Array<{ accountId: number; amount: number }> } }
  | { type: 'CONSOLIDATE_FUNDS'; payload: { accountIds: number[] } }
  | { type: 'CREATE_ORGANIZATION'; payload: Omit<AppOrganization, 'id' | 'created_at'> }
  | { type: 'ADMIN_APPROVE_BUSINESS'; payload: { businessId: string | number; orgId: string } }
  | { type: 'ADMIN_ASSIGN_ACCOUNT'; payload: { accountId: string | number; businessId: string | number } }
  | { type: 'ADMIN_UPDATE_SYSTEM_STATS'; payload: Partial<AppState['adminData']['systemStats']> }
  | { type: 'SWITCH_ORGANIZATION'; payload: string }
  | { type: 'UPDATE_SETUP_PROGRESS'; payload: Partial<AppState['setupProgress']> }
  | { type: 'RESET_DATA' }

// Context type
interface AppDataContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  
  // Core actions
  createBusiness: (data: Omit<AppBusiness, 'id' | 'dateCreated'>) => Promise<void>
  updateBusiness: (business: AppBusiness) => Promise<void>
  deleteBusiness: (id: string | number) => Promise<void>
  
  createAccount: (data: Omit<AppAccount, 'id' | 'dateAdded'>) => Promise<void>
  updateAccount: (account: AppAccount) => Promise<void>
  deleteAccount: (id: string | number) => Promise<void>
  
  addTransaction: (data: Omit<AppTransaction, 'id'>) => Promise<void>
  updateWalletBalance: (amount: number, type: 'add' | 'subtract') => Promise<void>
  
  // Wallet operations
  distributeFunds: (distributions: Array<{ accountId: number; amount: number }>) => Promise<void>
  consolidateFunds: (accountIds: number[]) => Promise<void>
  
  // Organization actions
  switchOrganization: (orgId: string) => void
  createOrganization: (data: Omit<AppOrganization, 'id' | 'created_at'>) => Promise<void>
  
  // Admin-specific actions
  adminApproveBusiness: (businessId: string | number, orgId: string) => Promise<void>
  adminAssignAccount: (accountId: string | number, businessId: string | number) => Promise<void>
  adminGetAllData: () => Promise<void>
  adminUpdateSystemStats: (stats: Partial<AppState['adminData']['systemStats']>) => void
  
  // Utility
  refreshData: () => Promise<void>
}

// Initial state
const initialState: AppState = {
  dataSource: getCurrentDataSource(),
  businesses: [],
  accounts: [],
  transactions: [],
  organizations: [],
  currentOrganization: null,
  teamMembers: [],
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
  },
  userRole: 'client',
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
  }
}

// Reducer
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
    
    case 'UPDATE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.map(b => 
          b.id === action.payload.id ? action.payload : b
        )
      }
    
    case 'DELETE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.filter(b => b.id !== action.payload)
      }
    
    case 'CREATE_ACCOUNT':
      const newAccount: AppAccount = {
        ...action.payload,
        id: Date.now().toString(),
        dateAdded: new Date().toISOString()
      }
      return {
        ...state,
        accounts: [...state.accounts, newAccount]
      }
    
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a => 
          a.id === action.payload.id ? action.payload : a
        )
      }
    
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(a => a.id !== action.payload)
      }
    
    case 'ADD_TRANSACTION':
      const newTransaction: AppTransaction = {
        ...action.payload,
        id: Date.now().toString()
      }
      return {
        ...state,
        transactions: [newTransaction, ...state.transactions]
      }

    case 'UPDATE_WALLET_BALANCE':
      const currentBalance = state.financialData.totalBalance
      const newBalance = action.payload.type === 'add' 
        ? currentBalance + action.payload.amount
        : currentBalance - action.payload.amount
      return {
        ...state,
        financialData: {
          ...state.financialData,
          totalBalance: Math.max(0, newBalance) // Prevent negative balance
        }
      }

    case 'SWITCH_ORGANIZATION':
      const org = state.organizations.find(o => o.id === action.payload)
      if (!org) return state
      
      // Load organization-specific data
      const orgBusinesses = convertAppBusinessesToAppBusinesses(APP_BUSINESSES_BY_ORG[action.payload] || [])
      const orgAccounts = convertAppAccountsToAppAccounts(APP_ACCOUNTS_BY_ORG[action.payload] || [])
      const orgTransactions = convertAppTransactionsToAppTransactions(APP_TRANSACTIONS_BY_ORG[action.payload] || [])
      const orgTeamMembers = MOCK_TEAM_MEMBERS_BY_ORG[action.payload] || []
      const orgFinancialData = convertFinancialData(APP_FINANCIAL_DATA_BY_ORG[action.payload] || APP_FINANCIAL_DATA)
      
      return { 
        ...state, 
        currentOrganization: org,
        businesses: orgBusinesses,
        accounts: orgAccounts,
        transactions: orgTransactions,
        teamMembers: orgTeamMembers,
        financialData: orgFinancialData
      }
    
    case 'UPDATE_SETUP_PROGRESS':
      return {
        ...state,
        setupProgress: { ...state.setupProgress, ...action.payload }
      }
    
    case 'ADMIN_APPROVE_BUSINESS':
      // Update the business status to approved and assign to organization
      const updatedBusinesses = state.businesses.map(business =>
        business.id === action.payload.businessId
          ? { ...business, status: 'approved' as const }
          : business
      )
      const updatedAdminBusinesses = state.adminData.allBusinesses.map(business =>
        business.id === action.payload.businessId
          ? { ...business, status: 'approved' as const }
          : business
      )
      return {
        ...state,
        businesses: updatedBusinesses,
        adminData: {
          ...state.adminData,
          allBusinesses: updatedAdminBusinesses,
          pendingApplications: state.adminData.pendingApplications.filter(
            app => app.id !== action.payload.businessId
          )
        }
      }
    
    case 'ADMIN_ASSIGN_ACCOUNT':
      // Assign account to business
      const updatedAccounts = state.accounts.map(account =>
        account.id === action.payload.accountId
          ? { ...account, businessId: action.payload.businessId, status: 'active' as const }
          : account
      )
      const updatedAdminAccounts = state.adminData.allAccounts.map(account =>
        account.id === action.payload.accountId
          ? { ...account, businessId: action.payload.businessId, status: 'active' as const }
          : account
      )
      return {
        ...state,
        accounts: updatedAccounts,
        adminData: {
          ...state.adminData,
          allAccounts: updatedAdminAccounts
        }
      }
    
    case 'ADMIN_UPDATE_SYSTEM_STATS':
      return {
        ...state,
        adminData: {
          ...state.adminData,
          systemStats: { ...state.adminData.systemStats, ...action.payload }
        }
      }
    
    case 'RESET_DATA':
      return { ...initialState, dataSource: state.dataSource }
    
    case 'CREATE_ORGANIZATION':
      const newOrganization: AppOrganization = {
        ...action.payload,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        verification_status: 'verified' as const
      }
      return {
        ...state,
        organizations: [...state.organizations, newOrganization]
      }
    
    case 'DISTRIBUTE_FUNDS':
      const totalDistributed = action.payload.distributions.reduce((sum, d) => sum + d.amount, 0)
      const updatedAccountsDistribute = state.accounts.map(account => {
        const distribution = action.payload.distributions.find(d => d.accountId === parseInt(account.id.toString()))
        if (distribution) {
          return { ...account, balance: account.balance + distribution.amount }
        }
        return account
      })
      
      // Create transactions for each distribution
      const distributionTransactions = action.payload.distributions.map(d => ({
        id: Date.now().toString() + d.accountId,
        type: 'transfer' as const,
        amount: d.amount,
        date: new Date().toISOString(),
        description: `Funds distributed to ${updatedAccountsDistribute.find(a => a.id === d.accountId)?.name || 'Account'}`,
        status: 'completed' as const,
        fromAccount: 'Main Wallet',
        toAccount: updatedAccountsDistribute.find(a => a.id === d.accountId)?.name || 'Account'
      }))
      
      return {
        ...state,
        accounts: updatedAccountsDistribute,
        transactions: [...distributionTransactions, ...state.transactions],
        financialData: {
          ...state.financialData,
          totalBalance: Math.max(0, state.financialData.totalBalance - totalDistributed)
        }
      }
    
    case 'CONSOLIDATE_FUNDS':
      const accountsToConsolidate = state.accounts.filter(account => 
        action.payload.accountIds.includes(parseInt(account.id.toString()))
      )
      const totalConsolidated = accountsToConsolidate.reduce((sum, account) => sum + account.balance, 0)
      
      const updatedAccountsConsolidate = state.accounts.map(account => {
        if (action.payload.accountIds.includes(parseInt(account.id.toString()))) {
          return { ...account, balance: 0 }
        }
        return account
      })
      
      // Create transactions for each consolidation
      const consolidationTransactions = accountsToConsolidate.map(account => ({
        id: Date.now().toString() + account.id,
        type: 'transfer' as const,
        amount: account.balance,
        date: new Date().toISOString(),
        description: `Funds consolidated from ${account.name}`,
        status: 'completed' as const,
        fromAccount: account.name,
        toAccount: 'Main Wallet'
      }))
      
      return {
        ...state,
        accounts: updatedAccountsConsolidate,
        transactions: [...consolidationTransactions, ...state.transactions],
        financialData: {
          ...state.financialData,
          totalBalance: state.financialData.totalBalance + totalConsolidated
        }
      }
    
    default:
      return state
  }
}

// Helper functions to convert mock data to app data
function convertAppBusinessesToAppBusinesses(mockBusinesses: any[]): AppBusiness[] {
  return mockBusinesses.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    balance: b.totalBalance || b.balance || 0,
    dateCreated: b.dateCreated,
    
    // Map all extended properties
    revenue: b.revenue,
    spend: b.spend || b.totalSpend,
    type: b.businessType || b.type,
    website: b.website,
    description: b.description,
    logo: b.logo,
    accountsCount: b.accountsCount,
    totalBalance: b.totalBalance,
    totalSpend: b.totalSpend,
    monthlyQuota: b.monthlyQuota,
    bmId: b.bmId,
    businessType: b.businessType,
    industry: b.industry,
    domains: b.domains,
    verification: b.verification,
    reviewNotes: b.reviewNotes,
    rejectionReason: b.rejectionReason
  }))
}

function convertAppAccountsToAppAccounts(mockAccounts: any[]): AppAccount[] {
  return mockAccounts.map(a => ({
    id: a.id,
    name: a.name,
    status: a.status,
    balance: a.balance,
    dateAdded: a.dateAdded || a.dateCreated,
    
    // Map all extended properties
    spend: a.spend || a.spent,
    revenue: a.revenue,
    businessId: a.businessId,
    business: a.business,
    adAccount: a.adAccount || a.accountId,
    spendLimit: a.spendLimit,
    quota: a.quota,
    spent: a.spent || a.spend,
    platform: a.platform,
    timezone: a.timezone,
    accountId: a.accountId || a.adAccount
  }))
}

function convertAppTransactionsToAppTransactions(mockTransactions: any[]): AppTransaction[] {
  return mockTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    date: t.date,
    description: t.description || t.name,
    status: t.status,
    
    // Map all extended properties
    fromAccount: t.fromAccount,
    toAccount: t.toAccount,
    name: t.name || t.description,
    account: t.account,
    timestamp: t.timestamp,
    reference: t.reference,
    paymentMethod: t.paymentMethod,
    fee: t.fee,
    netAmount: t.netAmount
  }))
}

function convertFinancialData(mockFinancialData: any): AppState['financialData'] {
  return {
    totalBalance: mockFinancialData.walletBalance || 0,
    totalRevenue: mockFinancialData.monthlyAdSpend * 12 || 0, // Estimate annual revenue
    totalSpend: mockFinancialData.monthlyAdSpend || 0,
    monthlyRevenue: mockFinancialData.monthlyAdSpend || 0,
    monthlySpend: mockFinancialData.monthlyAdSpend || 0,
    growthRate: mockFinancialData.monthlyGrowth || 0
  }
}

function convertAppOrganizationsToAppOrganizations(mockOrgs: any[]): AppOrganization[] {
  return mockOrgs.map(o => ({
    id: o.id,
    name: o.name,
    plan: o.plan,
    balance: o.usage?.monthlySpend || 0,
    created_at: o.memberSince || new Date().toISOString(),
    verification_status: 'verified' as const,
    avatar: o.avatar
  }))
}

// Context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Provider
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const [state, dispatch] = useReducer(appDataReducer, initialState)

  // Load initial data based on data source
  useEffect(() => {
    const loadData = async () => {
      if (state.dataSource === 'demo') {
        // Load demo data
        const orgId = state.currentOrganization?.id || 'org1'
        
        dispatch({ type: 'SET_ORGANIZATIONS', payload: convertAppOrganizationsToAppOrganizations(APP_ORGANIZATIONS) })
        dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: convertAppOrganizationsToAppOrganizations(APP_ORGANIZATIONS)[0] })
        dispatch({ type: 'SET_BUSINESSES', payload: convertAppBusinessesToAppBusinesses(APP_BUSINESSES_BY_ORG[orgId] || []) })
        dispatch({ type: 'SET_ACCOUNTS', payload: convertAppAccountsToAppAccounts(APP_ACCOUNTS_BY_ORG[orgId] || []) })
        dispatch({ type: 'SET_TRANSACTIONS', payload: convertAppTransactionsToAppTransactions(APP_TRANSACTIONS_BY_ORG[orgId] || []) })
        dispatch({ type: 'SET_TEAM_MEMBERS', payload: MOCK_TEAM_MEMBERS_BY_ORG[orgId] || [] })
        dispatch({ type: 'SET_FINANCIAL_DATA', payload: convertFinancialData(APP_FINANCIAL_DATA_BY_ORG[orgId] || APP_FINANCIAL_DATA) })
        
        // Set demo user profile
        dispatch({ type: 'SET_USER_PROFILE', payload: {
          id: 'demo-user-123',
          name: 'Demo Admin',
          email: 'admin@adhub.tech',
          timezone: 'UTC',
          language: 'en',
          notifications: { email: true, push: true, sms: false }
        }})
        
        // Set demo setup progress
        dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: {
          emailVerified: true,
          organizationCreated: true,
          firstBusinessAdded: true,
          firstAccountConnected: true,
          firstTopUp: true
        }})
      } else {
        // Load production data from Supabase
        try {
          dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: true } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'transactions', value: true } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'teamMembers', value: true } })

          if (!user) {
            console.log('No authenticated user for Supabase data loading')
            return
          }

          // Load user profile
          const userProfile = await UserService.getUserProfile(user.id)
          if (userProfile) {
            dispatch({ type: 'SET_USER_PROFILE', payload: userProfile })
          }

          // Load organizations for the user
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

            // Calculate financial data from real data
            const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
            const totalSpend = accounts.reduce((sum, account) => sum + (account.spent || 0), 0)
            const monthlySpend = transactions
              .filter(t => t.type === 'spend' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
              .reduce((sum, t) => sum + t.amount, 0)

            dispatch({ type: 'SET_FINANCIAL_DATA', payload: {
              totalBalance,
              totalSpend,
              monthlySpend,
              totalRevenue: 0, // Not tracked in current schema
              monthlyRevenue: 0,
              growthRate: 0
            }})

            // Calculate setup progress
            dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: {
              emailVerified: !!user.email_confirmed_at,
              organizationCreated: organizations.length > 0,
              firstBusinessAdded: businesses.length > 0,
              firstAccountConnected: accounts.length > 0,
              firstTopUp: transactions.some(t => t.type === 'topup')
            }})
          }

          // Load admin data if user is admin/superuser
          if (userProfile?.role === 'admin' || userProfile?.is_superuser) {
            dispatch({ type: 'SET_USER_ROLE', payload: userProfile.is_superuser ? 'superuser' : 'admin' })
            
            const [allBusinesses, allAccounts, allTransactions, allOrganizations] = await Promise.all([
              BusinessService.getAllBusinesses(),
              AccountService.getAllAccounts(),
              TransactionService.getAllTransactions(),
              OrganizationService.getAllOrganizations()
            ])

            const pendingApplications = allBusinesses.filter(b => b.status === 'pending')

            dispatch({ type: 'SET_ADMIN_DATA', payload: {
              allBusinesses,
              allAccounts,
              allTransactions,
              allOrganizations,
              pendingApplications,
              systemStats: {
                totalOrganizations: allOrganizations.length,
                activeTeams: allOrganizations.filter(o => o.verification_status === 'verified').length,
                pendingApplications: pendingApplications.length,
                monthlyRevenue: allTransactions
                  .filter(t => t.type === 'topup' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                  .reduce((sum, t) => sum + t.amount, 0)
              }
            }})
          }

        } catch (error) {
          console.error('Error loading Supabase data:', error)
          toast.error('Failed to load data. Please try again.')
          
          // Fallback to demo data on error
          dispatch({ type: 'SET_DATA_SOURCE', payload: 'demo' })
        } finally {
          dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: false } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'transactions', value: false } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'teamMembers', value: false } })
        }
      }
    }

    loadData()
  }, [state.dataSource, state.currentOrganization?.id, user])

  // Actions
  const createBusiness = async (data: Omit<AppBusiness, 'id' | 'dateCreated'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      if (state.dataSource === 'supabase' && state.currentOrganization) {
        // Use Supabase service
        const newBusiness = await BusinessService.createBusiness(state.currentOrganization.id, data)
        dispatch({ type: 'SET_BUSINESSES', payload: [...state.businesses, newBusiness] })
        toast.success(`Successfully created business: ${data.name}`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        dispatch({ type: 'CREATE_BUSINESS', payload: data })
        toast.success(`Successfully created business: ${data.name}`)
      }
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error('Failed to create business. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }

  const updateBusiness = async (business: AppBusiness) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'UPDATE_BUSINESS', payload: business })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success(`Successfully updated business: ${business.name}`)
  }

  const deleteBusiness = async (id: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const business = state.businesses.find(b => b.id === id)
    dispatch({ type: 'DELETE_BUSINESS', payload: id })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success(`Successfully deleted business: ${business?.name}`)
  }

  const createAccount = async (data: Omit<AppAccount, 'id' | 'dateAdded'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch({ type: 'CREATE_ACCOUNT', payload: data })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success(`Successfully created account: ${data.name}`)
  }

  const updateAccount = async (account: AppAccount) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'UPDATE_ACCOUNT', payload: account })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success(`Successfully updated account: ${account.name}`)
  }

  const deleteAccount = async (id: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const account = state.accounts.find(a => a.id === id)
    dispatch({ type: 'DELETE_ACCOUNT', payload: id })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success(`Successfully deleted account: ${account?.name}`)
  }

  const addTransaction = async (data: Omit<AppTransaction, 'id'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    dispatch({ type: 'ADD_TRANSACTION', payload: data })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    toast.success('Transaction added successfully')
  }

  const updateWalletBalance = async (amount: number, type: 'add' | 'subtract') => {
    dispatch({ type: 'UPDATE_WALLET_BALANCE', payload: { amount, type } })
  }

  const switchOrganization = (orgId: string) => {
    dispatch({ type: 'SWITCH_ORGANIZATION', payload: orgId })
    const org = state.organizations.find(o => o.id === orgId)
    if (org) {
      toast.success(`Switched to ${org.name}`)
    }
  }

  const createOrganization = async (data: Omit<AppOrganization, 'id' | 'created_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: true } })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'CREATE_ORGANIZATION', payload: data })
    dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: false } })
    
    // Update setup progress
    dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: { organizationCreated: true } })
    
    toast.success(`Organization "${data.name}" created successfully!`)
  }

  const refreshData = async () => {
    // Reload data based on current data source
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: true } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'transactions', value: true } })
    
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'accounts', value: false } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'transactions', value: false } })
    
    toast.success('Data refreshed successfully')
  }

  // Admin-specific methods
  const adminApproveBusiness = async (businessId: string | number, orgId: string) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dispatch({ type: 'ADMIN_APPROVE_BUSINESS', payload: { businessId, orgId } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    
    const business = state.businesses.find(b => b.id === businessId)
    toast.success(`Business "${business?.name}" approved and assigned to organization`)
  }

  const adminAssignAccount = async (accountId: string | number, businessId: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    dispatch({ type: 'ADMIN_ASSIGN_ACCOUNT', payload: { accountId, businessId } })
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    
    const account = state.accounts.find(a => a.id === accountId)
    const business = state.businesses.find(b => b.id === businessId)
    toast.success(`Account "${account?.name}" assigned to business "${business?.name}"`)
  }

  const adminGetAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: true } })
    
    // Load ALL data for admin view (not filtered by organization)
    const allBusinesses = convertAppBusinessesToAppBusinesses(APP_BUSINESSES)
    const allAccounts = convertAppAccountsToAppAccounts(APP_ACCOUNTS)
    const allTransactions = convertAppTransactionsToAppTransactions(APP_TRANSACTIONS)
    const allOrganizations = convertAppOrganizationsToAppOrganizations(APP_ORGANIZATIONS)
    
    // Calculate pending applications
    const pendingApplications = allBusinesses.filter(b => b.status === 'pending' || b.status === 'under_review')
    
    // Calculate system stats
    const systemStats = {
      totalOrganizations: allOrganizations.length,
      activeTeams: Object.keys(MOCK_TEAM_MEMBERS_BY_ORG).length,
      pendingApplications: pendingApplications.length,
      monthlyRevenue: allBusinesses.reduce((sum, b) => sum + (b.revenue || 0), 0)
    }

    dispatch({ type: 'SET_ADMIN_DATA', payload: {
      allBusinesses,
      allAccounts,
      allTransactions,
      allOrganizations,
      pendingApplications,
      systemStats
    }})
    
    // Also set the user role to admin
    dispatch({ type: 'SET_USER_ROLE', payload: 'admin' })
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'businesses', value: false } })
    toast.success('Admin data loaded successfully')
  }

  const adminUpdateSystemStats = (stats: Partial<AppState['adminData']['systemStats']>) => {
    dispatch({ type: 'ADMIN_UPDATE_SYSTEM_STATS', payload: stats })
  }

  const distributeFunds = async (distributions: Array<{ accountId: number; amount: number }>) => {
    dispatch({ type: 'DISTRIBUTE_FUNDS', payload: { distributions } })
  }

  const consolidateFunds = async (accountIds: number[]) => {
    dispatch({ type: 'CONSOLIDATE_FUNDS', payload: { accountIds } })
  }

  const value: AppDataContextType = {
    state,
    dispatch,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    createAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateWalletBalance,
    switchOrganization,
    createOrganization,
    adminApproveBusiness,
    adminAssignAccount,
    adminGetAllData,
    adminUpdateSystemStats,
    refreshData,
    distributeFunds,
    consolidateFunds
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

// Hook
export function useAppData() {
  // During SSR, return a default context to prevent build errors
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
      switchOrganization: () => {},
      createOrganization: async () => {},
      adminApproveBusiness: async () => {},
      adminAssignAccount: async () => {},
      adminGetAllData: async () => {},
      adminUpdateSystemStats: () => {},
      refreshData: async () => {},
      distributeFunds: async () => {},
      consolidateFunds: async () => {}
    } as AppDataContextType
  }
  
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}

// Backward compatibility hooks
export const useDemoState = useAppData // For components still using this
export const useProductionData = useAppData // For components still using this

// Additional compatibility hooks for admin functionality
export const useSuperuser = () => {
  const { state } = useAppData()
  return {
    isSuperuser: true, // In demo mode, always superuser
    loading: false,
    error: null,
    refreshStatus: async () => {}
  }
}

export const useAdAccounts = () => {
  const { state } = useAppData()
  return {
    adAccounts: state.accounts,
    loading: state.loading.accounts,
    error: null
  }
}

export const useWallet = () => {
  const { state } = useAppData()
  return {
    balance: state.financialData.totalBalance,
    loading: state.loading.businesses,
    error: null,
    topUp: async (amount: number) => {
      console.log('Wallet top-up:', amount)
    }
  }
} 