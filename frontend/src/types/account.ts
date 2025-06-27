export interface AdAccount {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  account_id: string;
  status: "active" | "pending" | "suspended" | "banned" | "under-review" | "archived";
  balance: number;
  spent: number;
  last_activity: string | null;
  created_at: string;
  updated_at: string;
  business?: { name: string }; // From join queries
}

export interface AppAccount {
  id: string;
  name: string;
  business: string;
  status: "active" | "pending" | "suspended" | "inactive";
  balance: number;
  spent: number;
  dateAdded: string;
}

export interface Account {
  id: string;
  name: string;
  account_id: string;
  business: string;
  status: "active" | "pending" | "inactive" | "suspended";
  balance: number;
  spent: number;
  created_at: string;
}
