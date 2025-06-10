export interface Business {
  id: string
  name: string
  status: "active" | "pending" | "suspended" | "rejected"
  dateCreated: string
  accountsCount: number
  totalBalance: number
  totalSpend: number
  monthlyQuota: number
  industry: string
  website?: string
  description?: string
  logo?: string
  bmId?: string // Facebook Business Manager ID
  domains?: { domain: string; verified: boolean }[] // Add domain verification at business level
}
