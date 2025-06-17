// Mock data store for businesses and ad accounts
// This simulates the backend functionality until we connect to real APIs

export interface MockBusiness {
  id: string
  name: string
  businessId: string
  status: "active" | "pending" | "suspended" | "inactive" | "provisioning" | "ready" | "under_review" | "rejected"
  landingPage?: string
  website?: string
  businessType?: string
  description?: string
  country?: string
  timezone?: string
  dateCreated: string
  verification: "verified" | "not_verified" | "pending" | "rejected"
  reviewNotes?: string
  rejectionReason?: string
  reviewedAt?: string
  
  // New provisioning fields
  provisioningStatus?: "not_started" | "hk_provider_submitted" | "hk_provider_approved" | "bm_assigned" | "account_created" | "client_invited" | "completed"
  hkProviderApplicationId?: string
  hkProviderStatus?: "pending" | "approved" | "rejected"
  assignedBmId?: string
  assignedProfileSetId?: string
  adAccountIds?: string[]
  provisioningNotes?: string
  provisioningStartedAt?: string
  provisioningCompletedAt?: string
  
  // Client delivery
  clientInvitedAt?: string
  clientAccessGranted?: boolean
  
  // Optional services
  needsFacebookPage?: boolean
  needsPixelSetup?: boolean
  facebookPageId?: string
  pixelId?: string
  
  adAccounts: MockAdAccount[]
}

export interface MockAdAccount {
  id: string
  name: string
  accountId: string
  status: "active" | "pending" | "paused" | "error"
  balance: number
  spent: number
  spendLimit: number
  platform: "Meta"
  dateCreated: string
  lastActivity: string
  businessId: string
}

// Initial mock data
let mockBusinesses: MockBusiness[] = [
  {
    id: "1",
    name: "My E-Commerce Store",
    businessId: "118010225380663",
    status: "active",
    landingPage: "https://store.example.com",
    website: "https://store.example.com",
    businessType: "ecommerce",
    description: "Online retail store specializing in consumer electronics and accessories",
    country: "US",
    timezone: "America/New_York",
    dateCreated: "04/10/2025",
    verification: "verified",
    adAccounts: [
      {
        id: "1",
        name: "Primary Marketing",
        accountId: "act_123456789",
        status: "active",
        balance: 1250,
        spent: 8450,
        spendLimit: 10000,
        platform: "Meta",
        dateCreated: "04/12/2025",
        lastActivity: "2 hours ago",
        businessId: "1"
      },
      {
        id: "2",
        name: "Holiday Campaign",
        accountId: "act_987654321",
        status: "pending",
        balance: 0,
        spent: 0,
        spendLimit: 2000,
        platform: "Meta",
        dateCreated: "04/20/2025",
        lastActivity: "1 day ago",
        businessId: "1"
      },
      {
        id: "3",
        name: "Retargeting Setup",
        accountId: "act_456789123",
        status: "active",
        balance: 850,
        spent: 3200,
        spendLimit: 5000,
        platform: "Meta",
        dateCreated: "04/15/2025",
        lastActivity: "30 minutes ago",
        businessId: "1"
      }
    ]
  },
  {
    id: "2", 
    name: "Blog Network",
    businessId: "117291547115266",
    status: "pending",
    landingPage: "https://blog.example.com",
    website: "https://blog.example.com",
    businessType: "other",
    description: "Content marketing and blog network",
    country: "US",
    timezone: "America/New_York",
    dateCreated: "04/22/2025",
    verification: "pending",
    adAccounts: []
  },
  {
    id: "3",
    name: "Affiliate Marketing Hub", 
    businessId: "847810749229077",
    status: "active",
    landingPage: "https://affiliate.example.com",
    website: "https://affiliate.example.com",
    businessType: "agency",
    description: "Performance marketing and affiliate management",
    country: "US",
    timezone: "America/Los_Angeles",
    dateCreated: "04/18/2025",
    verification: "verified",
    adAccounts: [
      {
        id: "4",
        name: "Main Affiliate Ads",
        accountId: "act_789123456",
        status: "active",
        balance: 3200,
        spent: 15600,
        spendLimit: 20000,
        platform: "Meta",
        dateCreated: "04/19/2025",
        lastActivity: "1 hour ago",
        businessId: "3"
      },
      {
        id: "5",
        name: "Testing Account",
        accountId: "act_321654987",
        status: "paused",
        balance: 150,
        spent: 850,
        spendLimit: 1000,
        platform: "Meta",
        dateCreated: "04/21/2025",
        lastActivity: "3 days ago",
        businessId: "3"
      }
    ]
  },
  // Additional pending applications for admin review demo
  {
    id: "4",
    name: "TechFlow Solutions",
    businessId: "",
    status: "provisioning",
    landingPage: "https://techflow.io",
    website: "https://techflow.io",
    businessType: "technology",
    description: "B2B SaaS platform providing workflow automation tools for enterprise clients",
    country: "US",
    timezone: "America/New_York",
    dateCreated: "01/15/2025",
    verification: "verified",
    reviewedAt: "2025-01-16T14:30:00Z",
    provisioningStatus: "hk_provider_submitted",
    hkProviderApplicationId: "HK-1705234567890",
    hkProviderStatus: "pending",
    provisioningStartedAt: "2025-01-16T14:30:00Z",
    provisioningNotes: "Application approved - starting provisioning pipeline",
    adAccounts: []
  },
  {
    id: "5",
    name: "Green Energy Co",
    businessId: "",
    status: "pending",
    landingPage: "https://greenenergy.com",
    website: "https://greenenergy.com",
    businessType: "energy",
    description: "Renewable energy solutions and solar panel installation services",
    country: "US",
    timezone: "America/Los_Angeles",
    dateCreated: "01/18/2025",
    verification: "pending",
    adAccounts: []
  },
  {
    id: "6",
    name: "FitLife Nutrition",
    businessId: "",
    status: "under_review",
    landingPage: "https://fitlifenutrition.com",
    website: "https://fitlifenutrition.com",
    businessType: "health",
    description: "Premium health supplements and personalized nutrition plans",
    country: "US",
    timezone: "America/Chicago",
    dateCreated: "01/12/2025",
    verification: "pending",
    reviewNotes: "Please provide additional documentation for health claims compliance",
    reviewedAt: "2025-01-20T10:30:00Z",
    adAccounts: []
  },
  {
    id: "7",
    name: "Digital Marketing Pro",
    businessId: "",
    status: "rejected",
    landingPage: "https://digitalmarketingpro.com",
    website: "https://digitalmarketingpro.com",
    businessType: "agency",
    description: "Full-service digital marketing agency specializing in social media advertising",
    country: "US",
    timezone: "America/New_York",
    dateCreated: "01/08/2025",
    verification: "rejected",
    rejectionReason: "Website content does not match business description. Please update your landing page to accurately reflect your services.",
    reviewedAt: "2025-01-16T14:45:00Z",
    adAccounts: []
  },
  {
    id: "8",
    name: "EcoFriendly Products",
    businessId: "",
    status: "pending",
    landingPage: "https://ecofriendlyproducts.shop",
    website: "https://ecofriendlyproducts.shop",
    businessType: "ecommerce",
    description: "Sustainable and eco-friendly household products and zero-waste solutions",
    country: "CA",
    timezone: "America/Toronto",
    dateCreated: "01/20/2025",
    verification: "pending",
    adAccounts: []
  },
  // Additional businesses in provisioning states
  {
    id: "9",
    name: "CloudTech Innovations",
    businessId: "",
    status: "provisioning",
    landingPage: "https://cloudtech.io",
    website: "https://cloudtech.io",
    businessType: "technology",
    description: "Cloud infrastructure and DevOps automation solutions",
    country: "US",
    timezone: "America/Los_Angeles",
    dateCreated: "01/14/2025",
    verification: "verified",
    reviewedAt: "2025-01-15T16:20:00Z",
    provisioningStatus: "bm_assigned",
    hkProviderApplicationId: "HK-1705123456789",
    hkProviderStatus: "approved",
    assignedBmId: "BM-1705567890123",
    assignedProfileSetId: "PS-1705567890123",
    provisioningStartedAt: "2025-01-15T16:20:00Z",
    provisioningNotes: "Business Manager assigned with 3-profile backup system",
    adAccounts: []
  },
  {
    id: "10",
    name: "HealthFirst Wellness",
    businessId: "",
    status: "provisioning",
    landingPage: "https://healthfirst.com",
    website: "https://healthfirst.com",
    businessType: "health",
    description: "Holistic wellness coaching and health optimization programs",
    country: "US",
    timezone: "America/New_York",
    dateCreated: "01/13/2025",
    verification: "verified",
    reviewedAt: "2025-01-14T11:45:00Z",
    provisioningStatus: "account_created",
    hkProviderApplicationId: "HK-1705098765432",
    hkProviderStatus: "approved",
    assignedBmId: "BM-1705432109876",
    assignedProfileSetId: "PS-1705432109876",
    adAccountIds: ["AD-1705654321098"],
    provisioningStartedAt: "2025-01-14T11:45:00Z",
    provisioningNotes: "Ad account created and linked to Business Manager",
    adAccounts: []
  },
  {
    id: "11",
    name: "RetailMax Solutions",
    businessId: "",
    status: "ready",
    landingPage: "https://retailmax.com",
    website: "https://retailmax.com",
    businessType: "ecommerce",
    description: "E-commerce optimization and retail analytics platform",
    country: "US",
    timezone: "America/Chicago",
    dateCreated: "01/10/2025",
    verification: "verified",
    reviewedAt: "2025-01-11T09:30:00Z",
    provisioningStatus: "completed",
    hkProviderApplicationId: "HK-1704987654321",
    hkProviderStatus: "approved",
    assignedBmId: "BM-1705321098765",
    assignedProfileSetId: "PS-1705321098765",
    adAccountIds: ["AD-1705543210987"],
    provisioningStartedAt: "2025-01-11T09:30:00Z",
    provisioningCompletedAt: "2025-01-12T14:15:00Z",
    clientInvitedAt: "2025-01-12T13:45:00Z",
    clientAccessGranted: true,
    provisioningNotes: "Provisioning completed - client has full access to ad accounts",
    adAccounts: []
  }
]

// Helper functions to generate IDs
const generateBusinessId = () => {
  return Math.floor(100000000000000 + Math.random() * 900000000000000).toString()
}

const generateAdAccountId = () => {
  return `act_${Math.floor(100000000 + Math.random() * 900000000)}`
}

const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  })
}

// Business operations
export const mockBusinessStore = {
  // Get all businesses
  getBusinesses: (): MockBusiness[] => {
    return [...mockBusinesses]
  },

  // Get business by ID
  getBusiness: (id: string): MockBusiness | undefined => {
    return mockBusinesses.find(b => b.id === id)
  },

  // Create new business
  createBusiness: (data: {
    name: string
    website: string
    timezone: string
    businessType?: string
    description?: string
    country?: string
  }): MockBusiness => {
    const newBusiness: MockBusiness = {
      id: generateId(),
      name: data.name,
      businessId: generateBusinessId(),
      status: "pending", // New businesses start as pending
      landingPage: data.website, // Use website for landing page
      website: data.website,
      businessType: data.businessType || "other",
      description: data.description || "",
      country: data.country || "US",
      timezone: data.timezone,
      dateCreated: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit", 
        year: "numeric"
      }),
      verification: "pending",
      adAccounts: []
    }

    mockBusinesses.push(newBusiness)
    
    // Simulate admin review process - auto-approve after 3 seconds for demo
    setTimeout(() => {
      const business = mockBusinesses.find(b => b.id === newBusiness.id)
      if (business) {
        business.status = "active"
        business.verification = "verified"
        console.log(`Business "${business.name}" has been approved!`)
        
        // Trigger a custom event to notify components
        window.dispatchEvent(new CustomEvent('businessApproved', { 
          detail: { businessId: business.id } 
        }))
      }
    }, 3000)

    return newBusiness
  },

  // Create new ad account
  createAdAccount: (data: {
    businessId: string
    name?: string
    spendLimit?: number
  }): MockAdAccount => {
    const business = mockBusinesses.find(b => b.id === data.businessId)
    if (!business) {
      throw new Error("Business not found")
    }

    if (business.status !== "active" || business.verification !== "verified") {
      throw new Error("Business must be approved and verified to create ad accounts")
    }

    const accountNumber = business.adAccounts.length + 1
    const newAdAccount: MockAdAccount = {
      id: generateId(),
      name: data.name || `Ad Account ${accountNumber}`,
      accountId: generateAdAccountId(),
      status: "pending", // New ad accounts start as pending
      balance: 0,
      spent: 0,
      spendLimit: data.spendLimit || 5000,
      platform: "Meta",
      dateCreated: formatDate(new Date()),
      lastActivity: "Just created",
      businessId: data.businessId
    }

    business.adAccounts.push(newAdAccount)

    // Simulate approval process - auto-approve after 2 seconds for demo
    setTimeout(() => {
      const account = business.adAccounts.find(a => a.id === newAdAccount.id)
      if (account) {
        account.status = "active"
        account.lastActivity = "Just activated"
        console.log(`Ad Account "${account.name}" has been activated!`)
        
        // Trigger a custom event to notify components
        window.dispatchEvent(new CustomEvent('adAccountActivated', { 
          detail: { accountId: account.id, businessId: data.businessId } 
        }))
      }
    }, 2000)

    return newAdAccount
  },

  // Get approved businesses (for ad account creation)
  getApprovedBusinesses: (): MockBusiness[] => {
    return mockBusinesses.filter(b => b.status === "active" && b.verification === "verified")
  },

  // Get ad accounts for a business
  getAdAccountsForBusiness: (businessId: string): MockAdAccount[] => {
    const business = mockBusinesses.find(b => b.id === businessId)
    return business ? business.adAccounts : []
  },

  // Update business status (for admin use)
  updateBusinessStatus: (businessId: string, status: MockBusiness['status'], verification?: MockBusiness['verification']) => {
    const business = mockBusinesses.find(b => b.id === businessId)
    if (business) {
      business.status = status
      if (verification) {
        business.verification = verification
      }
    }
  },

  // Update ad account status
  updateAdAccountStatus: (accountId: string, status: MockAdAccount['status']) => {
    for (const business of mockBusinesses) {
      const account = business.adAccounts.find(a => a.id === accountId)
      if (account) {
        account.status = status
        account.lastActivity = "Status updated"
        break
      }
    }
  },

  // Add balance to ad account
  addBalance: (accountId: string, amount: number) => {
    for (const business of mockBusinesses) {
      const account = business.adAccounts.find(a => a.id === accountId)
      if (account) {
        account.balance += amount
        account.lastActivity = `Added $${amount} balance`
        break
      }
    }
  },

  // Reset to initial state (for testing)
  reset: () => {
    mockBusinesses = [
      {
        id: "1",
        name: "My E-Commerce Store",
        businessId: "118010225380663",
        status: "active",
        landingPage: "https://store.example.com",
        website: "https://store.example.com",
        businessType: "ecommerce",
        description: "Online retail store specializing in consumer electronics and accessories",
        country: "US",
        timezone: "America/New_York",
        dateCreated: "04/10/2025",
        verification: "verified",
        adAccounts: [
          {
            id: "1",
            name: "Primary Marketing",
            accountId: "act_123456789",
            status: "active",
            balance: 1250,
            spent: 8450,
            spendLimit: 10000,
            platform: "Meta",
            dateCreated: "04/12/2025",
            lastActivity: "2 hours ago",
            businessId: "1"
          },
          {
            id: "2",
            name: "Holiday Campaign",
            accountId: "act_987654321",
            status: "pending",
            balance: 0,
            spent: 0,
            spendLimit: 2000,
            platform: "Meta",
            dateCreated: "04/20/2025",
            lastActivity: "1 day ago",
            businessId: "1"
          },
          {
            id: "3",
            name: "Retargeting Setup",
            accountId: "act_456789123",
            status: "active",
            balance: 850,
            spent: 3200,
            spendLimit: 5000,
            platform: "Meta",
            dateCreated: "04/15/2025",
            lastActivity: "30 minutes ago",
            businessId: "1"
          }
        ]
      }
    ]
  }
} 