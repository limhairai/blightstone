import { type AppBusiness, type AppAccount, type AppTransaction } from '../contexts/AppDataContext'

// Types for pricing plans
export interface PricingPlan {
  id: string
  title: string
  price: number
  billingPeriod: "monthly" | "annual"
  description: string
  topUpFee: string
  buttonText: string
  buttonLink: string
  features: string[]
  negativeFeatures?: string[]
  popular?: boolean
}

// Organization data structure
export interface AppOrganization {
  id: string
  name: string
  slug: string
  plan: string
  memberSince: string
  avatar?: string
  // Complete organization data
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billing: {
    nextPayment: string
    billingCycle: "monthly" | "annual"
    paymentMethod: {
      type: "credit_card" | "bank_transfer" | "paypal"
      last4: string
      brand: string
      expiryMonth: number
      expiryYear: number
    }
    billingHistory: Array<{
      id: string
      date: string
      amount: number
      status: "paid" | "pending" | "failed"
      description: string
    }>
  }
  limits: {
    businesses: number
    adAccounts: number
    teamMembers: number
    monthlySpend: number
  }
  usage: {
    businesses: number
    adAccounts: number
    teamMembers: number
    monthlySpend: number
  }
  teamMembers: Array<{
    id: string
    name: string
    email: string
    role: "owner" | "admin" | "member" | "viewer"
    avatar?: string
    joinedDate: string
    lastActive: string
    permissions: string[]
  }>
  apiKeys: Array<{
    id: string
    name: string
    key: string
    createdDate: string
    lastUsed?: string
    permissions: string[]
  }>
  webhooks: Array<{
    id: string
    url: string
    events: string[]
    status: "active" | "inactive"
    createdDate: string
  }>
  notifications: {
    email: boolean
    sms: boolean
    webhook: boolean
    lowBalance: boolean
    accountIssues: boolean
    weeklyReports: boolean
  }
}

// Centralized organization data - multiple organizations for demo
export const APP_ORGANIZATIONS: AppOrganization[] = [
  {
    id: "org_VrfbN6vMc2MCvaZELhfJ",
    name: "Startup Project",
    slug: "startup-project",
    plan: "Silver",
    memberSince: "January 2025",
    email: "admin@startupproject.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Innovation Drive",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    },
    billing: {
      nextPayment: "Mar 4, 2025",
      billingCycle: "monthly",
      paymentMethod: {
        type: "credit_card",
        last4: "4242",
        brand: "Visa",
        expiryMonth: 12,
        expiryYear: 2026
      },
      billingHistory: [
        {
          id: "inv_001",
          date: "Feb 4, 2025",
          amount: 299,
          status: "paid",
          description: "Silver Plan - Monthly"
        },
        {
          id: "inv_002", 
          date: "Jan 4, 2025",
          amount: 299,
          status: "paid",
          description: "Silver Plan - Monthly"
        },
        {
          id: "inv_003",
          date: "Dec 4, 2024",
          amount: 299,
          status: "paid",
          description: "Silver Plan - Monthly"
        }
      ]
    },
    limits: {
      businesses: 5,
      adAccounts: 50,
      teamMembers: 10,
      monthlySpend: 30000
    },
    usage: {
      businesses: 3,
      adAccounts: 5,
      teamMembers: 4,
      monthlySpend: 12450
    },
    teamMembers: [
      {
        id: "user_001",
        name: "John Smith",
        email: "john@startupproject.com",
        role: "owner",
        joinedDate: "January 2025",
        lastActive: "2 hours ago",
        permissions: ["all"]
      },
      {
        id: "user_002", 
        name: "Sarah Johnson",
        email: "sarah@startupproject.com",
        role: "admin",
        joinedDate: "January 2025",
        lastActive: "1 day ago",
        permissions: ["manage_businesses", "manage_accounts", "view_billing"]
      },
      {
        id: "user_003",
        name: "Mike Chen",
        email: "mike@startupproject.com", 
        role: "member",
        joinedDate: "February 2025",
        lastActive: "3 hours ago",
        permissions: ["manage_accounts", "view_reports"]
      },
      {
        id: "user_004",
        name: "Lisa Rodriguez",
        email: "lisa@startupproject.com",
        role: "viewer",
        joinedDate: "February 2025", 
        lastActive: "1 week ago",
        permissions: ["view_reports"]
      }
    ],
    apiKeys: [
      {
        id: "key_001",
        name: "Production API Key",
        key: "sk_live_51H7...",
        createdDate: "Jan 15, 2025",
        lastUsed: "2 hours ago",
        permissions: ["read", "write"]
      },
      {
        id: "key_002",
        name: "Analytics Integration",
        key: "sk_test_51H7...",
        createdDate: "Feb 1, 2025",
        lastUsed: "1 day ago", 
        permissions: ["read"]
      }
    ],
    webhooks: [
      {
        id: "wh_001",
        url: "https://api.startupproject.com/webhooks/adhub",
        events: ["account.created", "transaction.completed", "balance.low"],
        status: "active",
        createdDate: "Jan 20, 2025"
      }
    ],
    notifications: {
      email: true,
      sms: false,
      webhook: true,
      lowBalance: true,
      accountIssues: true,
      weeklyReports: true
    }
  },
  {
    id: "org_PersonalAccount123",
    name: "Personal Account",
    slug: "personal-account",
    plan: "Bronze",
    memberSince: "March 2024",
    email: "personal@example.com",
    phone: "+1 (555) 987-6543",
    address: {
      street: "456 Personal St",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      country: "United States"
    },
    billing: {
      nextPayment: "Mar 10, 2025",
      billingCycle: "monthly",
      paymentMethod: {
        type: "credit_card",
        last4: "1234",
        brand: "Mastercard",
        expiryMonth: 8,
        expiryYear: 2027
      },
      billingHistory: [
        {
          id: "inv_p001",
          date: "Feb 10, 2025",
          amount: 99,
          status: "paid",
          description: "Bronze Plan - Monthly"
        }
      ]
    },
    limits: {
      businesses: 2,
      adAccounts: 20,
      teamMembers: 3,
      monthlySpend: 10000
    },
    usage: {
      businesses: 1,
      adAccounts: 1,
      teamMembers: 1,
      monthlySpend: 2500
    },
    teamMembers: [
      {
        id: "user_p001",
        name: "Alex Johnson",
        email: "personal@example.com",
        role: "owner",
        joinedDate: "March 2024",
        lastActive: "1 hour ago",
        permissions: ["all"]
      }
    ],
    apiKeys: [],
    webhooks: [],
    notifications: {
      email: true,
      sms: true,
      webhook: false,
      lowBalance: true,
      accountIssues: true,
      weeklyReports: false
    }
  },
  {
    id: "org_AcmeCorp456",
    name: "Acme Corporation",
    slug: "acme-corporation",
    plan: "Gold",
    memberSince: "June 2023",
    avatar: "/placeholder.svg?height=32&width=32&text=AC",
    email: "admin@acmecorp.com",
    phone: "+1 (555) 111-2222",
    address: {
      street: "789 Corporate Blvd",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States"
    },
    billing: {
      nextPayment: "Mar 1, 2025",
      billingCycle: "annual",
      paymentMethod: {
        type: "bank_transfer",
        last4: "5678",
        brand: "Bank Transfer",
        expiryMonth: 0,
        expiryYear: 0
      },
      billingHistory: [
        {
          id: "inv_a001",
          date: "Mar 1, 2024",
          amount: 5988,
          status: "paid",
          description: "Gold Plan - Annual"
        }
      ]
    },
    limits: {
      businesses: 10,
      adAccounts: 100,
      teamMembers: 25,
      monthlySpend: 100000
    },
    usage: {
      businesses: 3,
      adAccounts: 5,
      teamMembers: 2,
      monthlySpend: 45000
    },
    teamMembers: [
      {
        id: "user_a001",
        name: "Robert Smith",
        email: "robert@acmecorp.com",
        role: "owner",
        joinedDate: "June 2023",
        lastActive: "30 minutes ago",
        permissions: ["all"]
      },
      {
        id: "user_a002",
        name: "Emily Davis",
        email: "emily@acmecorp.com",
        role: "admin",
        joinedDate: "August 2023",
        lastActive: "2 hours ago",
        permissions: ["manage_businesses", "manage_accounts", "view_billing"]
      }
    ],
    apiKeys: [
      {
        id: "key_a001",
        name: "Production API",
        key: "sk_live_acme...",
        createdDate: "Jun 15, 2023",
        lastUsed: "1 hour ago",
        permissions: ["read", "write"]
      }
    ],
    webhooks: [
      {
        id: "wh_a001",
        url: "https://api.acmecorp.com/webhooks",
        events: ["account.created", "transaction.completed"],
        status: "active",
        createdDate: "Jul 1, 2023"
      }
    ],
    notifications: {
      email: true,
      sms: false,
      webhook: true,
      lowBalance: true,
      accountIssues: true,
      weeklyReports: true
    }
  }
]

// Default organization (first one for backwards compatibility)
export const APP_ORGANIZATION: AppOrganization = APP_ORGANIZATIONS[0]

// Avatar utilities for consistent placeholder styling
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Mock pricing plans data
export const pricingPlans: PricingPlan[] = [
  {
    id: "bronze",
    title: "Bronze",
    price: 0,
    billingPeriod: "monthly",
    description: "0 to $1k daily, 0 to $10k monthly cap in spend",
    topUpFee: "6% of ad spend fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Account pool of 1",
      "Unlimited replacements",
      "$0 + 6% of ad spend fee",
      "$1k daily / $10k monthly cap"
    ],
    negativeFeatures: [
      "No free asset replacement",
      "No exclusive services"
    ],
  },
  {
    id: "silver",
    title: "Silver",
    price: 299,
    billingPeriod: "monthly",
    description: "$1k-$3k daily, $30k monthly cap in spend",
    topUpFee: "4% of ad spend fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Account pool of 3",
      "Unlimited replacements",
      "$299 + 4% of ad spend fee",
      "$1k-$3k daily / $30k monthly cap"
    ],
    negativeFeatures: [
      "No free asset replacement",
      "No exclusive services"
    ],
  },
  {
    id: "gold",
    title: "Gold",
    price: 799,
    billingPeriod: "monthly",
    description: "$100k monthly cap in spend",
    topUpFee: "3% of ad spend fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Account pool of 5",
      "Unlimited replacements",
      "Free asset replacement",
      "$799 + 3% of ad spend fee",
      "$100k monthly cap"
    ],
    negativeFeatures: [
      "No exclusive services"
    ],
  },
  {
    id: "platinum",
    title: "Platinum/Diamond",
    price: 2499,
    billingPeriod: "monthly",
    description: "$300k+ monthly cap in spend",
    topUpFee: "2% of ad spend fee",
    buttonText: "Contact Sales",
    buttonLink: "/contact",
    features: [
      "Account pool of 10",
      "Unlimited replacements",
      "Free asset replacement",
      "Postpay",
      "Exclusive services",
      "$2499 + 2% of ad spend fee",
      "$300k+ monthly cap"
    ],
    negativeFeatures: [],
  },
]

// Function to get pricing plans by billing period
export function getPlansByBillingPeriod(billingPeriod: "monthly" | "annual"): PricingPlan[] {
  return pricingPlans.filter((plan) => plan.billingPeriod === billingPeriod)
}

// Types for news items
export interface NewsItem {
  id: string
  company: string
  symbol: string
  time: string
  content: string
  price: string
  change: string
  isPositive: boolean
}

// Mock news data
export const newsItems: NewsItem[] = [
  {
    id: "1",
    company: "Super Micro Computer",
    symbol: "SMCI",
    time: "12:30PM",
    content:
      "Super Micro Computer's stock plummeted due to a short-selling attack and delayed 10-K filing after Hindenburg Research accused the company of poor accounting and sanction evasion.",
    price: "442.96",
    change: "1.30%",
    isPositive: false,
  },
  {
    id: "2",
    company: "Google",
    symbol: "GOOGL",
    time: "12:30PM",
    content:
      "Apple and Google Wallets aim to replace hotel room key cards by storing keys on phones. However, only 14% of guests at branded hotels currently use digital keys.",
    price: "442.96",
    change: "1.30%",
    isPositive: true,
  },
]

// Types for transactions
export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  status: "completed" | "pending" | "failed"
  type: "deposit" | "withdrawal" | "transfer"
  account: string
}

// Mock transactions data
export const appTransactions: Transaction[] = [
  {
    id: "1",
    date: "Apr 28, 2025",
    description: "Top up - Credit Card",
    amount: 500,
    status: "completed",
    type: "deposit",
    account: "1",
  },
  {
    id: "2",
    date: "Apr 25, 2025",
    description: "Ad Account Spend",
    amount: -120.5,
    status: "completed",
    type: "withdrawal",
    account: "1",
  },
  {
    id: "3",
    date: "Apr 22, 2025",
    description: "Top up - Bank Transfer",
    amount: 1000,
    status: "pending",
    type: "deposit",
    account: "1",
  },
  {
    id: "4",
    date: "Apr 20, 2025",
    description: "Ad Spend",
    amount: -250,
    status: "completed",
    type: "withdrawal",
    account: "2",
  },
  {
    id: "5",
    date: "Apr 18, 2025",
    description: "Top up - Bank Transfer",
    amount: 250,
    status: "completed",
    type: "deposit",
    account: "2",
  },
  {
    id: "6",
    date: "Apr 15, 2025",
    description: "Ad Spend",
    amount: -100,
    status: "completed",
    type: "withdrawal",
    account: "1",
  },
  {
    id: "7",
    date: "Apr 12, 2025",
    description: "Top up - Credit Card",
    amount: 500,
    status: "completed",
    type: "deposit",
    account: "1",
  },
  {
    id: "8",
    date: "Apr 10, 2025",
    description: "Ad Spend",
    amount: -75,
    status: "completed",
    type: "withdrawal",
    account: "2",
  },
  {
    id: "9",
    date: "Apr 8, 2025",
    description: "Top up - Bank Transfer",
    amount: 100,
    status: "failed",
    type: "deposit",
    account: "1",
  },
  {
    id: "10",
    date: "Apr 5, 2025",
    description: "Ad Spend",
    amount: -50,
    status: "completed",
    type: "withdrawal",
    account: "2",
  },
]

// Types for accounts
export interface Account {
  id: string
  name: string
  account: string
  status: "active" | "pending" | "disabled" | "idle" | "archived"
  users?: number
  billings?: number
  type?: string
  partner?: string
  currency?: string
  ads?: number
  estimated?: string
  holds?: string
  balance: number | string
  totalSpend?: number | string
  spendToday?: number | string
  spendLimit?: string
  dateAdded?: string
  dateCreated?: string
  lastActive?: string
  hasIssues?: boolean
  performance?: string
  projectId?: string
}

// Mock accounts data
export const accounts: Account[] = [
  {
    id: "1",
    name: "Primary Ad Account",
    account: "123456789",
    status: "active",
    users: 3,
    billings: 2,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 10,
    estimated: "$1,000",
    holds: "$0",
    balance: 750,
    totalSpend: 2500,
    spendToday: 50,
    spendLimit: "$1,000",
    dateAdded: "Oct 15, 2023",
    dateCreated: "Oct 15, 2023",
    lastActive: "Apr 28, 2025",
    hasIssues: false,
    projectId: "proj1",
  },
  {
    id: "2",
    name: "Secondary Campaign",
    account: "987654321",
    status: "active",
    users: 2,
    billings: 1,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 5,
    estimated: "$500",
    holds: "$0",
    balance: 1200,
    totalSpend: 1000,
    spendToday: 25,
    spendLimit: "$500",
    dateAdded: "Nov 02, 2023",
    dateCreated: "Nov 02, 2023",
    lastActive: "Apr 28, 2025",
    hasIssues: false,
    projectId: "proj2",
  },
  {
    id: "3",
    name: "Test Account",
    account: "456789123",
    status: "idle",
    users: 1,
    billings: 1,
    type: "Personal",
    partner: "Meta",
    currency: "USD",
    ads: 2,
    estimated: "$200",
    holds: "$0",
    balance: 500,
    totalSpend: 500,
    spendToday: 0,
    spendLimit: "$500",
    dateAdded: "Dec 10, 2023",
    dateCreated: "Dec 10, 2023",
    lastActive: "Apr 28, 2025",
    hasIssues: false,
    projectId: "proj1",
  },
  {
    id: "4",
    name: "Product Launch",
    account: "567891234",
    status: "active",
    users: 2,
    billings: 1,
    type: "Business",
    partner: "TikTok",
    currency: "USD",
    ads: 15,
    estimated: "$1,800.00",
    holds: "$0.00",
    balance: 3200,
    totalSpend: 7890,
    spendToday: 125.8,
    spendLimit: "$5,000",
    dateAdded: "Jan 05, 2024",
    dateCreated: "Jan 05, 2024",
    lastActive: "Apr 28, 2025",
    hasIssues: true,
    projectId: "proj3",
  },
  {
    id: "5",
    name: "New Marketing Campaign",
    account: "234567890",
    status: "pending",
    users: 0,
    billings: 0,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 0,
    estimated: "$0.00",
    holds: "$0.00",
    balance: 0,
    totalSpend: 0,
    spendToday: 0,
    spendLimit: "$1,500",
    dateAdded: "Apr 25, 2025",
    dateCreated: "Apr 25, 2025",
    lastActive: undefined,
    hasIssues: true,
  },
  {
    id: "6",
    name: "Q3 Promotion",
    account: "345678901",
    status: "disabled",
    users: 0,
    billings: 0,
    type: "Business",
    partner: "Meta",
    currency: "USD",
    ads: 0,
    estimated: "$0.00",
    holds: "$0.00",
    balance: 0,
    totalSpend: 4560,
    spendToday: 0,
    spendLimit: "$0.00",
    dateAdded: "Apr 27, 2025",
    dateCreated: "Apr 27, 2025",
    lastActive: undefined,
    hasIssues: true,
  },
]

// Helper functions
export const getTransactionsByAccount = (accountId: string) => {
  return appTransactions.filter((transaction) => transaction.account === accountId)
}

export const calculateTotalByType = (type: string): number => {
  return appTransactions.reduce((sum, tx) => {
    if (tx.type === type) {
      return sum + tx.amount
    }
    return sum
  }, 0)
}

export const getAccountById = (id: string) => {
  return accounts.find((account) => account.id === id)
}

export const getAccountSummary = () => {
  const totalAccounts = accounts.length
  const metaAccounts = accounts.filter((account) => account.partner === "Meta").length
  const tiktokAccounts = accounts.filter((account) => account.partner === "TikTok").length
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const metaBalance = accounts
    .filter((account) => account.partner === "Meta")
    .reduce((sum, account) => sum + Number(account.balance), 0)
  const tiktokBalance = accounts
    .filter((account) => account.partner === "TikTok")
    .reduce((sum, account) => sum + Number(account.balance), 0)

  return {
    totalAccounts,
    metaAccounts,
    tiktokAccounts,
    totalBalance,
    metaBalance,
    tiktokBalance,
  }
}

// Utility to get ad account quota for a given planId
export function getAdAccountQuota(planId: string): number | 'unlimited' {
  // Normalize planId to match pricingPlans (e.g., bronze, bronze-monthly, etc.)
  const plan = pricingPlans.find(p => p.id === planId || p.id.startsWith(planId));
  if (!plan) return 1; // fallback
  const feature = plan.features.find(f => f.includes('ad accounts'));
  if (!feature) return 1;
  if (feature.toLowerCase().includes('unlimited')) return 'unlimited';
  const match = feature.match(/Up to (\d+) ad accounts/);
  if (match) return parseInt(match[1], 10);
  return 1;
}

// Business type and mock businesses
export interface Business {
  id: string
  name: string
  domains: string[]
  status: "pending" | "approved" | "rejected"
  complianceNotes?: string
}

export const businesses: Business[] = [
  { id: "biz1", name: "My E-Commerce Store", domains: ["store.com"], status: "approved" },
  { id: "biz2", name: "Blog Network", domains: ["blog.com"], status: "pending" },
  { id: "biz3", name: "Affiliate Platform", domains: ["affiliate.com"], status: "approved" },
]

// Centralized mock data for consistent values across the application

// Legacy interfaces - use unified types from context instead
export interface LegacyAppTransaction {
  id: number
  name: string
  amount: number
  type: "spend" | "deposit" | "withdrawal"
  date: string
  account: string
  timestamp: Date
}

export interface LegacyAppAccount {
  id: number
  name: string
  business: string
  adAccount: string
  status: "active" | "pending" | "paused" | "error" | "inactive"
  balance: number
  spendLimit: number
  dateAdded: string
  quota: number
  spent: number
  platform: "Meta" | "Google" | "TikTok" | "LinkedIn"
  timezone?: string
}

export interface LegacyAppBusiness {
  id: string;
  name: string;
  businessType: string;
  industry?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  dateCreated: string;
  status: "pending" | "under_review" | "active" | "rejected" | "provisioning" | "ready";
  verification?: "pending" | "verified" | "rejected";
  reviewNotes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  
  // Business metrics and display properties
  accountsCount?: number;
  totalBalance?: number;
  totalSpend?: number;
  monthlyQuota?: number;
  logo?: string;
  bmId?: string;
  domains?: Array<{ domain: string; verified: boolean }>;
  
  // New provisioning fields
  provisioningStatus?: "not_started" | "hk_provider_submitted" | "hk_provider_approved" | "bm_assigned" | "account_created" | "client_invited" | "completed";
  hkProviderApplicationId?: string;
  hkProviderStatus?: "pending" | "approved" | "rejected";
  assignedBmId?: string;
  assignedProfileSetId?: string;
  adAccountIds?: string[];
  provisioningNotes?: string;
  provisioningStartedAt?: string;
  provisioningCompletedAt?: string;
  
  // Client delivery
  clientInvitedAt?: string;
  clientAccessGranted?: boolean;
  
  // Optional services
  needsFacebookPage?: boolean;
  needsPixelSetup?: boolean;
  facebookPageId?: string;
  pixelId?: string;
}

// Import the unified interface from the context
// export type { AppBusiness, AppAccount, AppTransaction, AppOrganization } from '../contexts/AppDataContext'

export interface AppChartData {
  date: string
  value: number
}

// Core financial data - this is the source of truth
export const APP_FINANCIAL_DATA = {
  // Main wallet balance (shown in topbar and wallet page)
  walletBalance: 45231.89,
  
  // Total ad spend this month
  monthlyAdSpend: 12450.00,
  
  // Available credit limit
  creditLimit: 50000.00,
  
  // Growth percentage this month
  monthlyGrowth: 12.5,
}

// Organization-specific financial data
export const APP_FINANCIAL_DATA_BY_ORG: Record<string, typeof APP_FINANCIAL_DATA> = {
  "org_VrfbN6vMc2MCvaZELhfJ": { // Startup Project
    walletBalance: 45231.89,
    monthlyAdSpend: 12450.00,
    creditLimit: 50000.00,
    monthlyGrowth: 12.5,
  },
  "org_PersonalAccount123": { // Personal Account
    walletBalance: 2850.00,
    monthlyAdSpend: 890.00,
    creditLimit: 10000.00,
    monthlyGrowth: 8.2,
  },
  "org_AcmeCorp456": { // Acme Corporation
    walletBalance: 125000.00,
    monthlyAdSpend: 45000.00,
    creditLimit: 200000.00,
    monthlyGrowth: 15.8,
  }
}

// Application constants - centralized configuration
export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  
  // Limits
  MAX_BUSINESSES_PER_ORG: 20,
  MAX_ACCOUNTS_PER_BUSINESS: 50,
  MAX_TEAM_MEMBERS: 50,
  
  // Commission rates by tier
  COMMISSION_RATES: {
    FREE: 0.05,
    BASIC: 0.03,
    PRO: 0.02,
    ENTERPRISE: 0.01,
  },
  
  // Default amounts for quick actions
  QUICK_TOP_UP_AMOUNTS: [100, 500, 1000, 5000],
  QUICK_WITHDRAW_AMOUNTS: [100, 500, 1000, 2000],
  
  // Time filter options
  TIME_FILTER_OPTIONS: [
    { value: "1 Week", label: "1 Week", days: 7 },
    { value: "1 Month", label: "1 Month", days: 30 },
    { value: "3 Months", label: "3 Months", days: 90 },
    { value: "1 Year", label: "1 Year", days: 365 },
    { value: "This Week", label: "This Week", days: 7 },
  ],
  
  // Status options
  ACCOUNT_STATUSES: ["active", "pending", "inactive", "suspended"],
  BUSINESS_STATUSES: ["active", "pending", "suspended"],
  TRANSACTION_STATUSES: ["completed", "pending", "failed"],
  
  // Platform options
  AD_PLATFORMS: ["Meta", "Google", "TikTok", "Snapchat", "Twitter"],
  
  // Industry options
  INDUSTRIES: [
    "Technology",
    "E-commerce", 
    "Healthcare",
    "Finance",
    "Education",
    "Real Estate",
    "Food & Beverage",
    "Fashion",
    "Travel",
    "Entertainment"
  ],
}

// Mock businesses data - organized by organization
export const APP_BUSINESSES: AppBusiness[] = [
  // Businesses for Startup Project (org_VrfbN6vMc2MCvaZELhfJ)
  {
    id: "1",
    name: "TechFlow Solutions",
    businessType: "Technology",
    status: "active",
    balance: 6700.0,
    dateCreated: "Feb 15, 2024",
    accountsCount: 2,
    totalBalance: 6700.0,
    totalSpend: 7850,
    monthlyQuota: 35000,
    industry: "Technology",
    website: "https://techflow.com",
    description: "Leading software development and consulting company",
    logo: "/placeholder.svg?height=40&width=40&text=TF",
    bmId: "1234567890123456",
    domains: [
      { domain: "techflow.com", verified: true },
      { domain: "techflow.io", verified: false },
    ],
  },
  {
    id: "2",
    name: "Digital Marketing Co",
    businessType: "Marketing",
    status: "active",
    balance: 1200.0,
    dateCreated: "Jan 28, 2024",
    accountsCount: 2,
    totalBalance: 1200.0,
    totalSpend: 2250,
    monthlyQuota: 11000,
    industry: "Marketing",
    website: "https://digitalmarketing.co",
    description: "Full-service digital marketing agency",
    logo: "/placeholder.svg?height=40&width=40&text=DM",
    bmId: "2345678901234567",
    domains: [{ domain: "digitalmarketing.co", verified: true }],
  },
  {
    id: "3",
    name: "StartupHub Inc",
    businessType: "Startup Incubator",
    status: "pending",
    balance: 800.0,
    dateCreated: "Mar 5, 2024",
    accountsCount: 1,
    totalBalance: 800.0,
    totalSpend: 1200,
    monthlyQuota: 5000,
    industry: "Startup Incubator",
    website: "https://startuphub.inc",
    description: "Startup incubator and venture capital firm",
    logo: "/placeholder.svg?height=40&width=40&text=SH",
    domains: [{ domain: "startuphub.inc", verified: false }],
  },
  {
    id: "4",
    name: "E-Commerce Plus",
    businessType: "E-commerce",
    status: "pending",
    balance: 1500.0,
    dateCreated: "Mar 8, 2024",
    accountsCount: 2,
    totalBalance: 1500.0,
    totalSpend: 3200,
    monthlyQuota: 15000,
    industry: "E-commerce",
    website: "https://ecommerceplus.com",
    description: "Multi-brand e-commerce platform",
    logo: "/placeholder.svg?height=40&width=40&text=EC",
    domains: [
      { domain: "ecommerceplus.com", verified: true },
      { domain: "shop.ecommerceplus.com", verified: false }
    ],
  },
  {
    id: "5",
    name: "FinTech Innovations",
    businessType: "Financial Technology",
    status: "under_review",
    balance: 2200.0,
    dateCreated: "Mar 12, 2024",
    accountsCount: 3,
    totalBalance: 2200.0,
    totalSpend: 4500,
    monthlyQuota: 25000,
    industry: "FinTech",
    website: "https://fintechinnovations.co",
    description: "Revolutionary financial technology solutions",
    logo: "/placeholder.svg?height=40&width=40&text=FI",
    domains: [{ domain: "fintechinnovations.co", verified: true }],
  },
]

// Businesses for other organizations (these would be loaded when switching orgs)
export const APP_BUSINESSES_BY_ORG: Record<string, AppBusiness[]> = {
  "org_VrfbN6vMc2MCvaZELhfJ": APP_BUSINESSES, // Startup Project
  "org_PersonalAccount123": [
    {
      id: "p1",
      name: "Personal Projects",
      businessType: "Personal",
      status: "active",
      balance: 500.0,
      dateCreated: "Apr 1, 2024",
      accountsCount: 1, // Matches the 1 account in APP_ACCOUNTS_BY_ORG
      totalBalance: 500.0, // Matches the account balance
      totalSpend: 800,
      monthlyQuota: 2000,
      industry: "Personal",
      website: "https://personal.example.com",
      description: "Personal side projects and experiments",
      logo: "/placeholder.svg?height=40&width=40&text=PP",
      bmId: "9876543210987654",
      domains: [{ domain: "personal.example.com", verified: true }],
    }
  ],
  "org_AcmeCorp456": [
    {
      id: "a1",
      name: "Acme Marketing",
      businessType: "Marketing",
      status: "active",
      balance: 23500.0,
      dateCreated: "Jun 15, 2023",
      accountsCount: 2, // 2 accounts: Enterprise Marketing Campaign + Brand Awareness - Marketing
      totalBalance: 23500.0, // 15000 + 8500
      totalSpend: 45000,
      monthlyQuota: 80000,
      industry: "Marketing",
      website: "https://marketing.acmecorp.com",
      description: "Enterprise marketing division",
      logo: "/placeholder.svg?height=40&width=40&text=AM",
      bmId: "1111222233334444",
      domains: [
        { domain: "marketing.acmecorp.com", verified: true },
        { domain: "ads.acmecorp.com", verified: true }
      ],
    },
    {
      id: "a2",
      name: "Acme Sales",
      businessType: "Sales",
      status: "active",
      balance: 12000.0,
      dateCreated: "Jul 20, 2023",
      accountsCount: 1, // 1 account: Lead Generation - Sales
      totalBalance: 12000.0, // Matches the account balance
      totalSpend: 22000,
      monthlyQuota: 40000,
      industry: "Sales",
      website: "https://sales.acmecorp.com",
      description: "Sales and lead generation campaigns",
      logo: "/placeholder.svg?height=40&width=40&text=AS",
      bmId: "5555666677778888",
      domains: [{ domain: "sales.acmecorp.com", verified: true }],
    },
    {
      id: "a3",
      name: "Acme Enterprise",
      businessType: "Enterprise",
      status: "active",
      balance: 23000.0,
      dateCreated: "Aug 10, 2023",
      accountsCount: 2, // 2 accounts: B2B Campaigns - Enterprise + Product Launch - Enterprise
      totalBalance: 23000.0, // 18000 + 5000
      totalSpend: 35000,
      monthlyQuota: 60000,
      industry: "Enterprise",
      website: "https://enterprise.acmecorp.com",
      description: "Enterprise solutions and B2B marketing",
      logo: "/placeholder.svg?height=40&width=40&text=AE",
      bmId: "9999000011112222",
      domains: [{ domain: "enterprise.acmecorp.com", verified: true }],
    }
  ]
}

// Mock accounts data - updated to match businesses
export const APP_ACCOUNTS: AppAccount[] = [
  {
    id: "1",
    name: "Primary Campaign Account",
    business: "TechFlow Solutions",
    adAccount: "1234567890123456",
    status: "active",
    balance: 2500.0,
    spendLimit: 5000.0,
    dateAdded: "Mar 15, 2024",
    quota: 15000,
    spent: 2250,
    platform: "Meta",
    timezone: "America/New_York",
  },
  {
    id: "2",
    name: "Brand Awareness Account",
    business: "Digital Marketing Co",
    adAccount: "2345678901234567",
    status: "pending",
    balance: 1200.0,
    spendLimit: 3000.0,
    dateAdded: "Mar 12, 2024",
    quota: 8000,
    spent: 1800,
    platform: "Google",
    timezone: "America/Los_Angeles",
  },
  {
    id: "3",
    name: "E-commerce Campaigns",
    business: "TechFlow Solutions",
    adAccount: "3456789012345678",
    status: "active",
    balance: 4200.0,
    spendLimit: 8000.0,
    dateAdded: "Mar 10, 2024",
    quota: 20000,
    spent: 5600,
    platform: "Meta",
    timezone: "America/New_York",
  },
  {
    id: "4",
    name: "Lead Generation",
    business: "StartupHub Inc",
    adAccount: "4567890123456789",
    status: "paused",
    balance: 800.0,
    spendLimit: 2000.0,
    dateAdded: "Mar 8, 2024",
    quota: 5000,
    spent: 1200,
    platform: "LinkedIn",
    timezone: "America/Chicago",
  },
  {
    id: "5",
    name: "Social Media Boost",
    business: "Digital Marketing Co",
    adAccount: "5678901234567890",
    status: "suspended",
    balance: 0.0,
    spendLimit: 1500.0,
    dateAdded: "Mar 5, 2024",
    quota: 3000,
    spent: 450,
    platform: "TikTok",
    timezone: "America/Los_Angeles",
  },
]

// Organization-specific accounts data
export const APP_ACCOUNTS_BY_ORG: Record<string, AppAccount[]> = {
  "org_VrfbN6vMc2MCvaZELhfJ": APP_ACCOUNTS, // Startup Project (existing accounts)
  "org_PersonalAccount123": [ // Personal Account
    {
      id: "101",
      name: "Personal Blog Ads",
      business: "Personal Projects",
      adAccount: "9876543210987654",
      status: "active",
      balance: 500.0,
      spendLimit: 1000.0,
      dateAdded: "Apr 1, 2024",
      quota: 2000,
      spent: 800,
      platform: "Meta",
      timezone: "America/New_York",
    }
  ],
  "org_AcmeCorp456": [ // Acme Corporation
    {
      id: "201",
      name: "Enterprise Marketing Campaign",
      business: "Acme Marketing",
      adAccount: "1111222233334444",
      status: "active",
      balance: 15000.0,
      spendLimit: 25000.0,
      dateAdded: "Jun 15, 2023",
      quota: 50000,
      spent: 35000,
      platform: "Meta",
      timezone: "America/New_York",
    },
    {
      id: "202",
      name: "Brand Awareness - Marketing",
      business: "Acme Marketing",
      adAccount: "1111222233334445",
      status: "active",
      balance: 8500.0,
      spendLimit: 15000.0,
      dateAdded: "Jul 1, 2023",
      quota: 30000,
      spent: 22000,
      platform: "Google",
      timezone: "America/New_York",
    },
    {
      id: "203",
      name: "Lead Generation - Sales",
      business: "Acme Sales",
      adAccount: "5555666677778888",
      status: "active",
      balance: 12000.0,
      spendLimit: 20000.0,
      dateAdded: "Jul 20, 2023",
      quota: 40000,
      spent: 28000,
      platform: "LinkedIn",
      timezone: "America/New_York",
    },
    {
      id: "204",
      name: "B2B Campaigns - Enterprise",
      business: "Acme Enterprise",
      adAccount: "9999000011112222",
      status: "active",
      balance: 18000.0,
      spendLimit: 30000.0,
      dateAdded: "Aug 10, 2023",
      quota: 60000,
      spent: 42000,
      platform: "Meta",
      timezone: "America/New_York",
    },
    {
      id: "205",
      name: "Product Launch - Enterprise",
      business: "Acme Enterprise",
      adAccount: "9999000011112223",
      status: "pending",
      balance: 5000.0,
      spendLimit: 10000.0,
      dateAdded: "Dec 1, 2023",
      quota: 20000,
      spent: 0,
      platform: "TikTok",
      timezone: "America/New_York",
    }
  ]
}

// Mock transactions data (most recent first)
export const APP_TRANSACTIONS: AppTransaction[] = [
  {
    id: "1",
    type: "spend",
    amount: -251.77, // Negative for outgoing money (ad spend)
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "Ad Spend - Primary Ad Account",
    status: "completed",
    name: "Ad Spend",
    account: "1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2",
    description: "Ad Spend", 
    amount: -531.45,
    type: "spend",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0],
    account: "2",
    status: "completed",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    id: "3",
    description: "Ad Spend",
    amount: -213.52,
    type: "spend", 
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0],
    account: "3",
    status: "completed",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "4",
    description: "Wallet Deposit",
    amount: 5000.00, // Positive for deposits (money coming in)
    type: "topup",
    date: new Date().toISOString().split("T")[0],
    account: "1",
    status: "completed",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "5",
    description: "Ad Spend",
    amount: -146.96,
    type: "spend",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0], 
    account: "4",
    status: "completed",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: "6",
    description: "Ad Spend",
    amount: -892.33,
    type: "spend",
    date: new Date().toISOString().split("T")[0],
    account: "5",
    status: "completed",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    id: "7",
    description: "Wallet Deposit",
    amount: 10000.00,
    type: "topup", 
    date: new Date().toISOString().split("T")[0],
    account: "1",
    status: "completed",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
  {
    id: "8",
    description: "Ad Spend",
    amount: -500.00,
    type: "spend",
    date: new Date().toISOString().split("T")[0],
    account: "2",
    status: "completed",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
]

// Organization-specific transactions data
export const APP_TRANSACTIONS_BY_ORG: Record<string, AppTransaction[]> = {
  "org_VrfbN6vMc2MCvaZELhfJ": APP_TRANSACTIONS, // Startup Project (existing transactions)
  "org_PersonalAccount123": [ // Personal Account
    {
      id: "101",
      description: "Ad Spend",
      amount: -45.50,
      type: "spend",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0],
      account: "101",
      status: "completed",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "102",
      description: "Wallet Deposit",
      amount: 500.00,
      type: "topup",
      date: new Date().toISOString().split("T")[0],
      account: "1",
      status: "completed",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: "103",
      description: "Ad Spend",
      amount: -125.75,
      type: "spend",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split("T")[0],
      account: "101",
      status: "completed",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  ],
  "org_AcmeCorp456": [ // Acme Corporation
    {
      id: "201",
      description: "Ad Spend",
      amount: -2500.00,
      type: "spend",
      date: new Date().toISOString().split("T")[0],
      account: "201",
      status: "completed",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: "202",
      description: "Ad Spend",
      amount: -1800.00,
      type: "spend",
      date: new Date().toISOString().split("T")[0],
      account: "202",
      status: "completed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "203",
      description: "Ad Spend",
      amount: -950.00,
      type: "spend",
      date: new Date().toISOString().split("T")[0],
      account: "203",
      status: "completed",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: "204",
      description: "Wallet Deposit",
      amount: 50000.00,
      type: "topup",
      date: new Date().toISOString().split("T")[0],
      account: "1",
      status: "completed",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: "205",
      description: "Ad Spend",
      amount: -3200.00,
      type: "spend",
      date: new Date().toISOString().split("T")[0],
      account: "204",
      status: "completed",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: "206",
      description: "Ad Spend",
      amount: -1500.00,
      type: "spend",
      date: new Date().toISOString().split("T")[0],
      account: "205",
      status: "completed",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    }
  ]
}

// Mock chart data for balance over time
export const APP_BALANCE_DATA: AppChartData[] = [
  { date: "Feb 23", value: 35000 },
  { date: "Mar 10", value: 38500 },
  { date: "Mar 25", value: 36800 },
  { date: "Apr 09", value: 41200 },
  { date: "Apr 24", value: 43900 },
  { date: "May 09", value: APP_FINANCIAL_DATA.walletBalance }, // Current balance
]

// Mock chart data for spending over time
export const APP_SPEND_DATA: AppChartData[] = [
  { date: "Feb 23", value: 8500 },
  { date: "Mar 10", value: 9200 },
  { date: "Mar 25", value: 7800 },
  { date: "Apr 09", value: 10500 },
  { date: "Apr 24", value: 11200 },
  { date: "May 09", value: APP_FINANCIAL_DATA.monthlyAdSpend },
]

// Helper functions
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0.00"
  }
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

export const formatRelativeTime = (timestamp: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) {
    return "Just now"
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  }
}

// Calculate derived values
export const getTotalAccountsBalance = (): number => {
  return APP_ACCOUNTS.reduce((total, account) => total + account.balance, 0)
}

export const getActiveAccountsCount = (): number => {
  return APP_ACCOUNTS.filter(account => account.status === "active").length
}

export const getTotalSpentThisMonth = (): number => {
  const thisMonth = new Date().getMonth()
  return APP_TRANSACTIONS
    .filter(t => t.type === "spend" && t.timestamp && new Date(t.timestamp).getMonth() === thisMonth)
    .reduce((total, t) => total + t.amount, 0)
}

export const getRecentTransactions = (limit: number = 5): AppTransaction[] => {
  return APP_TRANSACTIONS
    .filter(t => t.timestamp) // Filter out transactions without timestamp
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
    .slice(0, limit)
}

// Data validation and consistency checks
export const validateAppData = () => {
  const errors: string[] = []
  
  // Check that business names in accounts match business names in businesses
  const businessNames = new Set(APP_BUSINESSES.map(b => b.name))
  const accountBusinessNames = new Set(APP_ACCOUNTS.map(a => a.business).filter(Boolean))
  
  for (const businessName of accountBusinessNames) {
    if (businessName && !businessNames.has(businessName)) {
      errors.push(`Account references unknown business: ${businessName}`)
    }
  }
  
  // Check that account counts in businesses match actual accounts
  for (const business of APP_BUSINESSES) {
    const actualAccountCount = APP_ACCOUNTS.filter(a => a.business === business.name).length
    if (business.accountsCount !== actualAccountCount) {
      errors.push(`Business "${business.name}" claims ${business.accountsCount} accounts but has ${actualAccountCount}`)
    }
  }
  
  // Check that business total balances match sum of account balances
  for (const business of APP_BUSINESSES) {
    const actualBalance = APP_ACCOUNTS
      .filter(a => a.business === business.name)
      .reduce((sum, a) => sum + a.balance, 0)
    
    if (Math.abs((business.totalBalance || 0) - actualBalance) > 0.01) {
      errors.push(`Business "${business.name}" balance mismatch: claimed ${business.totalBalance}, actual ${actualBalance}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  const validation = validateAppData()
  if (!validation.isValid) {
    console.warn('Mock data validation errors:', validation.errors)
  } else {
    console.log('✅ Mock data validation passed')
  }
}

// Re-export transaction colors from design tokens for backward compatibility
export { transactionColorTokens as transactionColors } from "./design-tokens"

// Organization-specific team members data
export const MOCK_TEAM_MEMBERS_BY_ORG: Record<string, any[]> = {
  "org_VrfbN6vMc2MCvaZELhfJ": [ // Startup Project
    {
      id: "user_001",
      name: "John Smith",
      email: "john@startupproject.com",
      role: "owner",
      status: "active",
      joined: "January 2025",
      lastLogin: "2 hours ago",
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
      id: "user_002",
      name: "Sarah Johnson",
      email: "sarah@startupproject.com",
      role: "admin",
      status: "active",
      joined: "January 2025",
      lastLogin: "1 day ago",
      authentication: "Google",
      signInCount: 24,
      invitedBy: "John Smith",
      permissions: {
        canManageTeam: true,
        canManageBusinesses: true,
        canManageAccounts: true,
        canManageWallet: false,
        canViewAnalytics: true
      }
    },
    {
      id: "user_003",
      name: "Mike Chen",
      email: "mike@startupproject.com",
      role: "member",
      status: "active",
      joined: "February 2025",
      lastLogin: "3 hours ago",
      authentication: "Text Provider",
      signInCount: 12,
      invitedBy: "Sarah Johnson",
      permissions: {
        canManageTeam: false,
        canManageBusinesses: false,
        canManageAccounts: true,
        canManageWallet: false,
        canViewAnalytics: true
      }
    },
    {
      id: "user_004",
      name: "Lisa Rodriguez",
      email: "lisa@startupproject.com",
      role: "member",
      status: "pending",
      joined: "February 2025",
      authentication: "Pending",
      signInCount: 0,
      invitedBy: "John Smith",
      permissions: {
        canManageTeam: false,
        canManageBusinesses: false,
        canManageAccounts: false,
        canManageWallet: false,
        canViewAnalytics: false
      }
    }
  ],
  "org_PersonalAccount123": [ // Personal Account
    {
      id: "user_p001",
      name: "Alex Johnson",
      email: "personal@example.com",
      role: "owner",
      status: "active",
      joined: "March 2024",
      lastLogin: "1 hour ago",
      authentication: "Google",
      signInCount: 89,
      permissions: {
        canManageTeam: true,
        canManageBusinesses: true,
        canManageAccounts: true,
        canManageWallet: true,
        canViewAnalytics: true
      }
    }
  ],
  "org_AcmeCorp456": [ // Acme Corporation
    {
      id: "user_a001",
      name: "Robert Smith",
      email: "robert@acmecorp.com",
      role: "owner",
      status: "active",
      joined: "June 2023",
      lastLogin: "30 minutes ago",
      authentication: "Google",
      signInCount: 234,
      permissions: {
        canManageTeam: true,
        canManageBusinesses: true,
        canManageAccounts: true,
        canManageWallet: true,
        canViewAnalytics: true
      }
    },
    {
      id: "user_a002",
      name: "Emily Davis",
      email: "emily@acmecorp.com",
      role: "admin",
      status: "active",
      joined: "August 2023",
      lastLogin: "2 hours ago",
      authentication: "Microsoft",
      signInCount: 156,
      invitedBy: "Robert Smith",
      permissions: {
        canManageTeam: true,
        canManageBusinesses: true,
        canManageAccounts: true,
        canManageWallet: false,
        canViewAnalytics: true
      }
    }
  ]
}

// Add new profile set and BM management interfaces
export interface ProfileSet {
  id: string;
  name: string;
  mainProfileId: string;
  backupProfile1Id: string;
  backupProfile2Id: string;
  status: "active" | "compromised" | "maintenance";
  managedBmCount: number;
  maxBmCapacity: number; // 20 per set
  createdAt: string;
  lastHealthCheck?: string;
}

export interface BusinessManager {
  id: string;
  name: string;
  fbBmId: string;
  assignedProfileSetId: string;
  assignedBusinessId?: string; // null if available for assignment
  status: "available" | "assigned" | "active" | "suspended";
  createdAt: string;
  assignedAt?: string;
  adAccountIds: string[];
  healthStatus: "healthy" | "warning" | "critical";
  lastHealthCheck?: string;
}

export interface AdAccountInventory {
  id: string;
  account: string;
  source: "hk_provider" | "other";
  status: "available" | "assigned" | "active" | "suspended";
  assignedBusinessId?: string;
  assignedBmId?: string;
  spendLimit: number;
  currency: string;
  createdAt: string;
  assignedAt?: string;
}

export interface ProfileTeam {
  id: string;
  name: string; // "Team 1", "Team 2", etc.
  
  // Profiles (1+2 setup)
  mainProfile: {
    id: string;
    name: string;
    browserProfileId: string;
    status: 'active' | 'banned' | 'maintenance';
  };
  backupProfiles: [
    {
      id: string;
      name: string;
      browserProfileId: string; 
      status: 'active' | 'banned' | 'maintenance';
    },
    {
      id: string;
      name: string;
      browserProfileId: string;
      status: 'active' | 'banned' | 'maintenance';
    }
  ];
  
  // Capacity
  maxBusinessManagers: 20;
  currentBusinessManagers: number;
  
  // Status
  status: 'active' | 'maintenance' | 'full';
  createdAt: string;
  lastHealthCheck: string;
}

// Generate mock profile teams
export const APP_PROFILE_TEAMS: ProfileTeam[] = Array.from({ length: 8 }, (_, i) => {
  const teamNumber = i + 1;
  const currentBMs = Math.min(20, Math.floor(Math.random() * 22)); // Some teams at capacity
  
  return {
    id: `team_${teamNumber}`,
    name: `Team ${teamNumber}`,
    mainProfile: {
      id: `profile_main_${teamNumber}`,
      name: `team${teamNumber}_main`,
      browserProfileId: `dolphin_main_${teamNumber}`,
      status: 'active'
    },
    backupProfiles: [
      {
        id: `profile_backup1_${teamNumber}`,
        name: `team${teamNumber}_backup1`,
        browserProfileId: `dolphin_backup1_${teamNumber}`,
        status: 'active'
      },
      {
        id: `profile_backup2_${teamNumber}`,
        name: `team${teamNumber}_backup2`,
        browserProfileId: `dolphin_backup2_${teamNumber}`,
        status: 'active'
      }
    ],
    maxBusinessManagers: 20,
    currentBusinessManagers: currentBMs,
    status: currentBMs >= 20 ? 'full' : 'active',
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastHealthCheck: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  };
});

export interface TeamBusinessManager {
  id: string;
  name: string;
  fbBmId: string;
  assignedTeamId: string;
  assignedBusinessId?: string; // null if available for assignment
  clientName: string;
  organizationId: string;
  status: 'active' | 'restricted' | 'suspended' | 'flagged';
  
  // Ad account info
  adAccountIds: string[];
  maxAdAccounts: 6;
  currentAdAccounts: number;
  
  // Financial
  monthlySpend: number;
  spendLimit: number;
  
  // Health
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastHealthCheck: string;
  alerts: number;
  
  // Timestamps
  createdAt: string;
  assignedAt?: string;
  lastActivity: string;
}

// Generate mock business managers with team assignments
export const APP_TEAM_BUSINESS_MANAGERS: TeamBusinessManager[] = (() => {
  const managers: TeamBusinessManager[] = [];
  let bmIndex = 0;
  
  APP_PROFILE_TEAMS.forEach(team => {
    for (let i = 0; i < team.currentBusinessManagers; i++) {
      const adAccountCount = Math.floor(Math.random() * 6) + 1;
      const monthlySpend = Math.floor(Math.random() * 50000) + 5000;
      const alerts = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0;
      
      managers.push({
        id: `bm_${bmIndex + 1}`,
        name: `Business Manager ${bmIndex + 1}`,
        fbBmId: `fb_bm_${bmIndex + 1}`,
        assignedTeamId: team.id,
        assignedBusinessId: `business_${bmIndex + 1}`,
        clientName: `Client ${String.fromCharCode(65 + (bmIndex % 26))}${Math.floor(bmIndex / 26) + 1}`,
        organizationId: `org_${Math.floor(bmIndex / 5) + 1}`,
        status: ['active', 'restricted', 'suspended', 'flagged'][Math.floor(Math.random() * 4)] as any,
        
        adAccountIds: Array.from({ length: adAccountCount }, (_, j) => `ad_${bmIndex}_${j + 1}`),
        maxAdAccounts: 6,
        currentAdAccounts: adAccountCount,
        
        monthlySpend,
        spendLimit: monthlySpend + Math.floor(Math.random() * 20000),
        
        healthStatus: alerts > 0 ? 'warning' : 'healthy',
        lastHealthCheck: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        alerts,
        
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        assignedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      bmIndex++;
    }
  });
  
  return managers;
})();
