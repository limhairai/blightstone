export interface Business {
  id: string
  name: string
  industry: string
  status: "active" | "pending" | "suspended" | "under_review"
  businessManagerId: string
  accountsCount: number
  totalSpend: number
  monthlySpend: number
  lastActivity: string
  createdAt: string
  logo?: string
  website?: string
  description?: string
  domains?: string[]
  verifiedDomains?: string[]
}

export const MOCK_BUSINESSES: Business[] = [
  {
    id: "1",
    name: "TechFlow Solutions",
    industry: "Technology",
    status: "active",
    businessManagerId: "BM-789012345",
    accountsCount: 8,
    totalSpend: 125000,
    monthlySpend: 15000,
    lastActivity: "2024-01-15T10:30:00Z",
    createdAt: "2023-06-15T09:00:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=TF",
    website: "https://techflow.com",
    description:
      "Leading technology solutions provider specializing in cloud infrastructure and digital transformation.",
    domains: ["techflow.com", "techflow.io"],
    verifiedDomains: ["techflow.com"],
  },
  {
    id: "2",
    name: "Digital Marketing Co",
    industry: "Marketing",
    status: "active",
    businessManagerId: "BM-456789012",
    accountsCount: 12,
    totalSpend: 89000,
    monthlySpend: 12000,
    lastActivity: "2024-01-14T16:45:00Z",
    createdAt: "2023-08-20T14:30:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=DM",
    website: "https://digitalmarketing.co",
    description: "Full-service digital marketing agency helping businesses grow their online presence.",
    domains: ["digitalmarketing.co", "dmco.agency"],
    verifiedDomains: ["digitalmarketing.co"],
  },
  {
    id: "3",
    name: "StartupHub Inc",
    industry: "Consulting",
    status: "pending",
    businessManagerId: "BM-123456789",
    accountsCount: 3,
    totalSpend: 25000,
    monthlySpend: 5000,
    lastActivity: "2024-01-13T11:20:00Z",
    createdAt: "2023-11-10T08:15:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=SH",
    website: "https://startuphub.inc",
    description: "Startup incubator and consulting firm supporting early-stage companies.",
    domains: ["startuphub.inc"],
    verifiedDomains: [],
  },
  {
    id: "4",
    name: "E-commerce Plus",
    industry: "E-commerce",
    status: "active",
    businessManagerId: "BM-987654321",
    accountsCount: 15,
    totalSpend: 200000,
    monthlySpend: 25000,
    lastActivity: "2024-01-15T09:15:00Z",
    createdAt: "2023-03-05T12:00:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=EP",
    website: "https://ecommerceplus.com",
    description: "Multi-brand e-commerce platform with global reach and innovative shopping experiences.",
    domains: ["ecommerceplus.com", "shop.ecommerceplus.com"],
    verifiedDomains: ["ecommerceplus.com", "shop.ecommerceplus.com"],
  },
  {
    id: "5",
    name: "HealthTech Innovations",
    industry: "Healthcare",
    status: "under_review",
    businessManagerId: "BM-555666777",
    accountsCount: 5,
    totalSpend: 45000,
    monthlySpend: 8000,
    lastActivity: "2024-01-12T14:30:00Z",
    createdAt: "2023-09-18T10:45:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=HT",
    website: "https://healthtech-innovations.com",
    description: "Innovative healthcare technology solutions improving patient outcomes and healthcare delivery.",
    domains: ["healthtech-innovations.com"],
    verifiedDomains: [],
  },
  {
    id: "6",
    name: "Green Energy Corp",
    industry: "Energy",
    status: "suspended",
    businessManagerId: "BM-111222333",
    accountsCount: 6,
    totalSpend: 75000,
    monthlySpend: 0,
    lastActivity: "2023-12-20T08:00:00Z",
    createdAt: "2023-05-12T15:30:00Z",
    logo: "/placeholder.svg?height=40&width=40&text=GE",
    website: "https://greenenergycorp.com",
    description: "Renewable energy solutions and sustainable technology development company.",
    domains: ["greenenergycorp.com"],
    verifiedDomains: ["greenenergycorp.com"],
  },
]
