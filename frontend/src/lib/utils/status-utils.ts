/**
 * Client-Friendly Status Utils
 * 
 * This utility provides functions to convert technical ad account statuses 
 * (like Dolphin connection issues) into user-friendly statuses that clients understand.
 * 
 * The main principle: Never show "inactive" to clients due to temporary API issues.
 * Instead, show the last known Facebook status or assume "active" as the default.
 */

/**
 * Converts a raw ad account status to a client-friendly status
 * 
 * @param rawStatus - The raw status from the API (e.g., "inactive", "active", "pending")
 * @param metadata - Account metadata that may contain last_known_status
 * @returns A client-friendly status that won't confuse users
 */
export function getClientFriendlyStatus(rawStatus: string, metadata?: any): string {
  // If status is "inactive" (usually means Dolphin is disconnected), 
  // check for last known status from when connection was working
  if (rawStatus === 'inactive' && metadata?.last_known_status) {
    return metadata.last_known_status;
  }
  
  // For other statuses, return as-is but map some technical statuses to user-friendly ones
  switch (rawStatus) {
    case 'active':
      return 'active';
    case 'pending':
      return 'pending';
    case 'suspended':
      return 'suspended';
    case 'restricted':
      return 'restricted';
    case 'inactive':
      // If no last known status, assume it was active (most common case)
      // This prevents showing "inactive" due to temporary API issues
      return 'active';
    default:
      return rawStatus;
  }
}

/**
 * Filters accounts by client-friendly status
 * 
 * @param accounts - Array of ad account objects
 * @param targetStatus - The status to filter by (e.g., "active", "pending")
 * @returns Filtered array of accounts with the specified client-friendly status
 */
export function filterAccountsByClientStatus(accounts: any[], targetStatus: string): any[] {
  return accounts.filter((account: any) => 
    getClientFriendlyStatus(account.status, account.metadata) === targetStatus
  );
}

/**
 * Gets count of accounts by client-friendly status
 * 
 * @param accounts - Array of ad account objects
 * @param targetStatus - The status to count (e.g., "active", "pending")
 * @returns Number of accounts with the specified client-friendly status
 */
export function countAccountsByClientStatus(accounts: any[], targetStatus: string): number {
  return filterAccountsByClientStatus(accounts, targetStatus).length;
} 