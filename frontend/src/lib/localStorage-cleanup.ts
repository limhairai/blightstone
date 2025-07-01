// localStorage cleanup utility
// This helps clear stale organization data that might be causing issues

export function clearStaleOrganizationData() {
  if (typeof window === 'undefined') return; // Don't run on server
  
  try {
    const hasStaleOrgId = localStorage.getItem('currentOrganizationId');
    if (hasStaleOrgId) {
      console.log('🧹 Clearing stale organization data from localStorage');
      localStorage.removeItem('currentOrganizationId');
      localStorage.removeItem('currentOrganizationName');
      console.log('🧹 Cleared stale organization data');
    }
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

export function forceReloadPageAfterCleanup() {
  if (typeof window === 'undefined') return;
  
  const hadStaleData = localStorage.getItem('currentOrganizationId');
  if (hadStaleData) {
    clearStaleOrganizationData();
    console.log('🔄 Reloading page to ensure clean state...');
    window.location.reload();
  }
} 