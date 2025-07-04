// Semantic ID Type Definitions
// Auto-generated during migration

export interface Application {
  applicationId: string;
  organizationId: string;
  requestType: string;
  targetBmDolphinId?: string;
  websiteUrl: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  clientNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  assetId: string;
  type: 'business_manager' | 'ad_account' | 'profile';
  dolphinId: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, any>;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetBinding {
  bindingId: string;
  assetId: string;
  organizationId: string;
  status: 'active' | 'inactive';
  boundBy: string;
  boundAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  profileId: string;
  organizationId?: string;
  name?: string;
  email?: string;
  role: string;
  isSuperuser: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFulfillment {
  fulfillmentId: string;
  applicationId: string;
  assetId: string;
  createdAt: string;
}

// Field mapping utilities
export const FIELD_MAPPINGS = {
  // Database -> Frontend
  application_id: 'applicationId',
  asset_id: 'assetId',
  binding_id: 'bindingId',
  profile_id: 'profileId',
  fulfillment_id: 'fulfillmentId',
  organization_id: 'organizationId',
  wallet_id: 'walletId',
  transaction_id: 'transactionId',
  request_id: 'requestId',
} as const;
