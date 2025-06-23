/**
 * Asset Management System
 * Replaces all hardcoded placeholder images and asset paths
 */

// Asset configuration from environment variables
export const ASSETS = {
  // Avatar and profile images
  PLACEHOLDER_AVATAR: process.env.NEXT_PUBLIC_PLACEHOLDER_AVATAR || '/placeholder.svg',
  DEFAULT_USER_AVATAR: process.env.NEXT_PUBLIC_DEFAULT_USER_AVATAR || '/default-avatar.svg',
  
  // Business and organization logos
  PLACEHOLDER_LOGO: process.env.NEXT_PUBLIC_PLACEHOLDER_LOGO || '/placeholder.svg',
  DEFAULT_BUSINESS_LOGO: process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_LOGO || '/default-business.svg',
  DEFAULT_ORG_LOGO: process.env.NEXT_PUBLIC_DEFAULT_ORG_LOGO || '/default-org.svg',
  
  // Dashboard and marketing images
  DASHBOARD_WIDE: process.env.NEXT_PUBLIC_DASHBOARD_WIDE || '/dashboard-wide.png',
  DASHBOARD_COMPACT: process.env.NEXT_PUBLIC_DASHBOARD_COMPACT || '/dashboard-compact.png',
  
  // Brand assets
  ADHUB_LOGO: process.env.NEXT_PUBLIC_ADHUB_LOGO || '/adhub-logo-placeholder.png',
  ADHUB_ICON: process.env.NEXT_PUBLIC_ADHUB_ICON || '/adhub-icon.png',
  
  // Fallback for missing images
  FALLBACK_IMAGE: process.env.NEXT_PUBLIC_FALLBACK_IMAGE || '/fallback.svg',
}

// Asset utility functions
export const getAvatarUrl = (userAvatar?: string | null): string => {
  if (userAvatar) return userAvatar
  return ASSETS.DEFAULT_USER_AVATAR
}

export const getBusinessLogoUrl = (businessLogo?: string | null): string => {
  if (businessLogo) return businessLogo
  return ASSETS.DEFAULT_BUSINESS_LOGO
}

export const getOrganizationLogoUrl = (orgLogo?: string | null): string => {
  if (orgLogo) return orgLogo
  return ASSETS.DEFAULT_ORG_LOGO
}

export const getPlaceholderUrl = (type: 'avatar' | 'logo' | 'business' | 'org' = 'avatar'): string => {
  switch (type) {
    case 'avatar':
      return ASSETS.PLACEHOLDER_AVATAR
    case 'logo':
      return ASSETS.PLACEHOLDER_LOGO
    case 'business':
      return ASSETS.DEFAULT_BUSINESS_LOGO
    case 'org':
      return ASSETS.DEFAULT_ORG_LOGO
    default:
      return ASSETS.FALLBACK_IMAGE
  }
}

// Generate avatar with initials (for when no image is available)
export const generateAvatarUrl = (name: string, size: number = 32): string => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
  
  // Use a service like UI Avatars or create a data URL
  const backgroundColor = process.env.NEXT_PUBLIC_AVATAR_BG_COLOR || '3B82F6'
  const textColor = process.env.NEXT_PUBLIC_AVATAR_TEXT_COLOR || 'FFFFFF'
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor}&color=${textColor}&bold=true`
}

// Validate asset URLs
export const isValidImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'data:'
  } catch {
    return false
  }
}

// Asset preloading for better performance
export const preloadAssets = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
        img.src = url
      })
    })
  )
}

// Critical assets to preload
export const CRITICAL_ASSETS = [
  ASSETS.ADHUB_LOGO,
  ASSETS.ADHUB_ICON,
  ASSETS.DEFAULT_USER_AVATAR,
  ASSETS.DEFAULT_BUSINESS_LOGO,
]

// Asset configuration info for debugging
export const getAssetInfo = () => ({
  assets: ASSETS,
  environment: process.env.NODE_ENV,
  hasCustomAvatars: !!process.env.NEXT_PUBLIC_DEFAULT_USER_AVATAR,
  hasCustomLogos: !!process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_LOGO,
  criticalAssets: CRITICAL_ASSETS,
}) 