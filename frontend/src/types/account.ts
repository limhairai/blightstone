export interface AppAccount {
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

export interface Account {
  id: string
  name: string
  accountId: string
  business: string
  status: "active" | "pending" | "inactive" | "suspended"
  balance: number
  spendLimit: number
  dateAdded: string
  quota: number
  spent: number
  platform: string
}
