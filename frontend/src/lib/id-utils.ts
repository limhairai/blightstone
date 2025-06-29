/**
 * Utility functions to handle the various ID formats in our system
 * This helps abstract away the current ID confusion while we gradually refactor
 */

export interface BusinessManagerIds {
  /** Internal database UUID (bm_id) */
  internalId: string;
  /** Dolphin API ID (dolphin_business_manager_id) */
  dolphinId: string;
  /** Display name for UI */
  displayName?: string;
}

export interface AdAccountIds {
  /** Internal database UUID (asset_id) */
  internalId: string;
  /** Dolphin API ID (dolphin_asset_id) */
  dolphinId: string;
  /** Facebook Ad Account ID from metadata */
  facebookId?: string;
  /** Display name for UI */
  displayName?: string;
}

/**
 * Maps business manager data from API to standardized format
 */
export function mapBusinessManagerIds(bmData: any): BusinessManagerIds {
  return {
    internalId: bmData.bm_id || bmData.id,
    dolphinId: bmData.dolphin_business_manager_id || bmData.dolphin_asset_id,
    displayName: bmData.name || `BM #${(bmData.dolphin_business_manager_id || '').substring(0, 8)}`,
  };
}

/**
 * Maps ad account data from API to standardized format
 */
export function mapAdAccountIds(adData: any): AdAccountIds {
  const metadata = adData.asset_metadata || adData.metadata || {};
  
  return {
    internalId: adData.asset_id || adData.id,
    dolphinId: adData.dolphin_asset_id || adData.dolphin_account_id,
    facebookId: metadata.ad_account_id || metadata.account_id,
    displayName: adData.name || `Account #${(metadata.ad_account_id || '').substring(0, 8)}`,
  };
}

/**
 * Generates consistent URLs for business manager navigation
 */
export function getBusinessManagerUrl(bmIds: BusinessManagerIds, path: 'accounts' | 'details' = 'accounts'): string {
  if (path === 'accounts') {
    return `/dashboard/accounts?bm_id=${encodeURIComponent(bmIds.internalId)}`;
  }
  return `/admin/business-managers/${encodeURIComponent(bmIds.internalId)}`;
}

/**
 * Extracts business manager ID from URL parameters
 */
export function extractBmIdFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('bm_id') || searchParams.get('business_manager_id') || searchParams.get('bmId');
}

/**
 * Temporary helper to handle the current ID confusion
 * TODO: Remove this once we standardize the schema
 */
export function normalizeBusinessManagerId(id: string | undefined): string | null {
  if (!id) return null;
  
  // Handle various ID formats we might encounter
  if (id.includes('-')) {
    // Looks like a UUID (internal ID)
    return id;
  }
  
  // Looks like a Dolphin ID (numeric string)
  // For now, we'll assume it's already the correct format
  return id;
} 