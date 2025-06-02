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
    id: "bronze-monthly",
    title: "Bronze",
    price: 49,
    billingPeriod: "monthly",
    description: "Perfect for small businesses and startups",
    topUpFee: "2.5% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: ["Up to 5 ad accounts", "Basic analytics", "Email support", "1 team member", "Manual top-ups"],
    negativeFeatures: ["Advanced analytics", "Priority support", "Unlimited team members"],
  },
  {
    id: "silver-monthly",
    title: "Silver",
    price: 99,
    billingPeriod: "monthly",
    description: "Great for growing businesses",
    topUpFee: "1.5% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Up to 15 ad accounts",
      "Advanced analytics",
      "Priority email support",
      "5 team members",
      "Scheduled top-ups",
    ],
    popular: true,
  },
  {
    id: "gold-monthly",
    title: "Gold",
    price: 199,
    billingPeriod: "monthly",
    description: "For established businesses",
    topUpFee: "1% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Up to 50 ad accounts",
      "Advanced analytics",
      "Priority phone support",
      "15 team members",
      "Automated top-ups",
      "Dedicated account manager",
    ],
  },
  {
    id: "platinum-monthly",
    title: "Platinum",
    price: 399,
    billingPeriod: "monthly",
    description: "For large enterprises",
    topUpFee: "0.5% top-up fee",
    buttonText: "Contact Sales",
    buttonLink: "/contact",
    features: [
      "Unlimited ad accounts",
      "Custom analytics",
      "24/7 phone support",
      "Unlimited team members",
      "Automated top-ups",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
  {
    id: "bronze-annual",
    title: "Bronze",
    price: 39,
    billingPeriod: "annual",
    description: "Perfect for small businesses and startups",
    topUpFee: "2.5% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: ["Up to 5 ad accounts", "Basic analytics", "Email support", "1 team member", "Manual top-ups"],
    negativeFeatures: ["Advanced analytics", "Priority support", "Unlimited team members"],
  },
  {
    id: "silver-annual",
    title: "Silver",
    price: 79,
    billingPeriod: "annual",
    description: "Great for growing businesses",
    topUpFee: "1.5% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Up to 15 ad accounts",
      "Advanced analytics",
      "Priority email support",
      "5 team members",
      "Scheduled top-ups",
    ],
    popular: true,
  },
  {
    id: "gold-annual",
    title: "Gold",
    price: 159,
    billingPeriod: "annual",
    description: "For established businesses",
    topUpFee: "1% top-up fee",
    buttonText: "Get Started",
    buttonLink: "/register",
    features: [
      "Up to 50 ad accounts",
      "Advanced analytics",
      "Priority phone support",
      "15 team members",
      "Automated top-ups",
      "Dedicated account manager",
    ],
  },
  {
    id: "platinum-annual",
    title: "Platinum",
    price: 319,
    billingPeriod: "annual",
    description: "For large enterprises",
    topUpFee: "0.5% top-up fee",
    buttonText: "Contact Sales",
    buttonLink: "/contact",
    features: [
      "Unlimited ad accounts",
      "Custom analytics",
      "24/7 phone support",
      "Unlimited team members",
      "Automated top-ups",
      "Dedicated account manager",
      "Custom integrations",
    ],
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
    lastActive: null,
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
    lastActive: null,
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
