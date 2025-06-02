export interface AdAccount {
  id: string;
  name: string;
  accountId: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING_REVIEW';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  metaAccessToken: string;
  metaRefreshToken: string;
  metaTokenExpiresAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  adAccountId: string;
  dailyBudget: number;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ad {
  id: string;
  name: string;
  campaignId: string;
  adAccountId: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  creative: {
    title: string;
    body: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: string[];
    locations: string[];
    interests: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface Group {
  id: string;
  name: string;
  websiteUrl: string;
  status: "pending" | "approved" | "rejected";
  adAccountIds: string[];
  allowedUsers: string[];
  limit?: number;
  orgId: string;
} 