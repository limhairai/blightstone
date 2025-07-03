/**
 * Utility functions for API calls
 */

/**
 * Builds a proper API URL without double slashes
 * @param path - API path like '/api/dolphin-assets/all-assets'
 * @returns Properly formatted URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || ''
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Creates authentication headers for API calls
 * @param token - Access token
 * @returns Headers object
 */
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
} 