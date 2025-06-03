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
  accountId: string
}

// Mock transactions data
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "Apr 28, 2025",
    description: "Top up - Credit Card",
    amount: 500,
    status: "completed",
    type: "deposit",
    accountId: "1",
  },
  {
    id: "2",
    date: "Apr 25, 2025",
    description: "Ad Account Spend",
    amount: -120.5,
    status: "completed",
    type: "withdrawal",
    accountId: "1",
  },
  {
    id: "3",
    date: "Apr 22, 2025",
    description: "Top up - Bank Transfer",
    amount: 1000,
    status: "pending",
    type: "deposit",
    accountId: "1",
  },
  {
    id: "4",
    date: "Apr 20, 2025",
    description: "Ad Spend",
    amount: -250,
    status: "completed",
    type: "withdrawal",
    accountId: "2",
  },
  {
    id: "5",
    date: "Apr 18, 2025",
    description: "Top up - Bank Transfer",
    amount: 250,
    status: "completed",
    type: "deposit",
    accountId: "2",
  },
  {
    id: "6",
    date: "Apr 15, 2025",
    description: "Ad Spend",
    amount: -100,
    status: "completed",
    type: "withdrawal",
    accountId: "1",
  },
  {
    id: "7",
    date: "Apr 12, 2025",
    description: "Top up - Credit Card",
    amount: 500,
    status: "completed",
    type: "deposit",
    accountId: "1",
  },
  {
    id: "8",
    date: "Apr 10, 2025",
    description: "Ad Spend",
    amount: -75,
    status: "completed",
    type: "withdrawal",
    accountId: "2",
  },
  {
    id: "9",
    date: "Apr 8, 2025",
    description: "Top up - Bank Transfer",
    amount: 100,
    status: "failed",
    type: "deposit",
    accountId: "1",
  },
  {
    id: "10",
    date: "Apr 5, 2025",
    description: "Ad Spend",
    amount: -50,
    status: "completed",
    type: "withdrawal",
    accountId: "2",
  },
]

// Types for accounts
export interface Account {
  id: string
  name: string
  accountId: string
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
    accountId: "123456789",
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
    accountId: "987654321",
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
    accountId: "456789123",
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
    accountId: "567891234",
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
    accountId: "234567890",
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
    accountId: "345678901",
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
  return mockTransactions.filter((transaction) => transaction.accountId === accountId)
}

export const calculateTotalByType = (type: string): number => {
  return mockTransactions.reduce((sum, tx) => {
    if (tx.type === type) {
      return sum + tx.amount
    }
    return sum
  }, 0)
}

export const getRecentTransactions = (limit = 5, type?: "deposit" | "withdrawal" | "transfer") => {
  const filteredTransactions = type ? mockTransactions.filter((tx) => tx.type === type) : mockTransactions
  return filteredTransactions.slice(0, limit)
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

// Project type and mock projects
export interface Project {
  id: string
  name: string
  domains: string[]
  status: "pending" | "approved" | "rejected"
  complianceNotes?: string
}

export const projects: Project[] = [
  { id: "proj1", name: "My E-Commerce Store", domains: ["store.com"], status: "approved" },
  { id: "proj2", name: "Blog Network", domains: ["blog.com"], status: "pending" },
  { id: "proj3", name: "Affiliate Platform", domains: ["affiliate.com"], status: "approved" },
]
