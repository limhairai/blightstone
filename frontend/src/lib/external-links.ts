/**
 * External Platform Deep Link Generators
 * These create direct links to specific resources in external platforms
 * No special permissions required - just URL pattern recognition
 */

export interface BusinessManager {
  id: string;
  name: string;
}

export interface AdAccount {
  id: string;
  name: string;
  businessManagerId: string;
}

export interface DolphinProfile {
  id: string;
  name: string;
}

/**
 * Facebook Business Manager Deep Links
 */
export const facebookLinks = {
  // Business Manager Overview
  businessManager: (bmId: string) => 
    `https://business.facebook.com/settings/accounts?business_id=${bmId}`,
  
  // Ads Manager - Specific Ad Account
  adAccount: (adAccountId: string, bmId?: string) => {
    const baseUrl = `https://business.facebook.com/adsmanager/manage/accounts?act=${adAccountId}`;
    return bmId ? `${baseUrl}&business_id=${bmId}` : baseUrl;
  },
  
  // Ad Account Settings
  adAccountSettings: (adAccountId: string, bmId: string) =>
    `https://business.facebook.com/settings/ad-accounts/${adAccountId}?business_id=${bmId}`,
  
  // Business Manager Users & Permissions
  businessUsers: (bmId: string) =>
    `https://business.facebook.com/settings/people?business_id=${bmId}`,
  
  // Payment Methods
  paymentMethods: (bmId: string) =>
    `https://business.facebook.com/settings/payment-methods?business_id=${bmId}`,
  
  // Business Verification
  businessVerification: (bmId: string) =>
    `https://business.facebook.com/settings/business-verification?business_id=${bmId}`
};

/**
 * Dolphin Cloud Deep Links (Web-based)
 */
export const dolphinCloudLinks = {
  // Dashboard
  dashboard: () => 'https://cloud.dolphin.tech/dashboard',
  
  // Business Manager Management
  businessManagers: () => 'https://cloud.dolphin.tech/business-managers',
  
  // Specific Business Manager
  businessManager: (bmId: string) => 
    `https://cloud.dolphin.tech/business-managers/${bmId}`,
  
  // Ad Accounts Overview
  adAccounts: () => 'https://cloud.dolphin.tech/ad-accounts',
  
  // Specific Ad Account
  adAccount: (adAccountId: string) =>
    `https://cloud.dolphin.tech/ad-accounts/${adAccountId}`,
  
  // Campaigns
  campaigns: (adAccountId?: string) => 
    adAccountId 
      ? `https://cloud.dolphin.tech/campaigns?account=${adAccountId}`
      : 'https://cloud.dolphin.tech/campaigns',
  
  // Financial Overview
  billing: () => 'https://cloud.dolphin.tech/billing',
  
  // Account Health
  health: () => 'https://cloud.dolphin.tech/health'
};

/**
 * Dolphin Anty Deep Links (Desktop App + Web Fallback)
 * Dolphin Anty supports custom protocol for desktop app integration
 */
export const dolphinAntyLinks = {
  // Web Dashboard (fallback)
  webDashboard: () => 'https://anty.dolphin.tech/dashboard',
  
  // Desktop App - Dashboard
  dashboard: () => 'dolphin-anty://dashboard',
  
  // Desktop App - Browser Profiles
  profiles: () => 'dolphin-anty://profiles',
  
  // Desktop App - Specific Profile (launch profile)
  profile: (profileId: string) => `dolphin-anty://profiles/${profileId}`,
  
  // Desktop App - Launch Profile in Browser
  launchProfile: (profileId: string) => `dolphin-anty://launch/${profileId}`,
  
  // Desktop App - Proxy Management
  proxies: () => 'dolphin-anty://proxies',
  
  // Desktop App - Team Management
  team: () => 'dolphin-anty://team',
  
  // Desktop App - Profile Templates
  templates: () => 'dolphin-anty://templates',
  
  // Web fallbacks for each desktop link
  webProfiles: () => 'https://anty.dolphin.tech/profiles',
  webProfile: (profileId: string) => `https://anty.dolphin.tech/profiles/${profileId}`,
  webProxies: () => 'https://anty.dolphin.tech/proxies',
  webTeam: () => 'https://anty.dolphin.tech/team',
  webTemplates: () => 'https://anty.dolphin.tech/templates'
};

/**
 * Account Provider Deep Links
 * Replace with your actual account provider URLs
 */
export const providerLinks = {
  // Main portal dashboard
  portal: () => 'https://accounts.hkprovider.com/dashboard',
  
  // Submit new application
  submitApplication: () => 'https://accounts.hkprovider.com/applications/new',
  
  // View all applications
  applications: () => 'https://accounts.hkprovider.com/applications',
  
  // Check specific application status
  applicationStatus: (applicationId: string) =>
    `https://accounts.hkprovider.com/applications/${applicationId}`,
  
  // Account delivery/pickup
  accountDelivery: () => 'https://accounts.hkprovider.com/delivery',
  
  // Billing & payments
  billing: () => 'https://accounts.hkprovider.com/billing',
  
  // Support tickets
  support: () => 'https://accounts.hkprovider.com/support',
  
  // Account inventory (available accounts)
  inventory: () => 'https://accounts.hkprovider.com/inventory',
  
  // Bulk order management
  bulkOrders: () => 'https://accounts.hkprovider.com/bulk-orders'
};

/**
 * Utility function to open external link with desktop app fallback
 */
export const openExternalLink = (url: string, trackingData?: Record<string, any>) => {
  // Optional: Track external link clicks for analytics
  if (trackingData) {
  
    // You could send this to your analytics service
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open desktop app with web fallback
 * Tries to open desktop app first, falls back to web if app not installed
 */
export const openDesktopAppWithFallback = (
  desktopUrl: string, 
  webFallbackUrl: string, 
  trackingData?: Record<string, any>
) => {
  if (trackingData) {
  
  }

  const protocol = desktopUrl.split('://')[0];
  const cacheKey = `desktop_app_${protocol}_available`;

  // Try to open desktop app
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = desktopUrl;
  document.body.appendChild(iframe);

  // Track if app opened successfully
  let appOpened = false;
  
  // Listen for page visibility change (indicates app might have opened)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      appOpened = true;
      localStorage.setItem(cacheKey, 'true');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Set timeout to open web fallback if desktop app doesn't respond
  setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    
    // If app didn't open, cache that info and open web fallback
    if (!appOpened) {
      localStorage.setItem(cacheKey, 'false');
      window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1500);
};

/**
 * Generate multiple related links for a client
 */
export const generateClientLinks = (client: {
  businessManagerId: string;
  adAccounts: Array<{ id: string; name: string }>;
  dolphinProfiles?: Array<{ id: string; name: string }>;
}) => {
  return {
    facebook: {
      businessManager: facebookLinks.businessManager(client.businessManagerId),
      adAccounts: client.adAccounts.map(account => ({
        name: account.name,
        url: facebookLinks.adAccount(account.id, client.businessManagerId)
      })),
      settings: facebookLinks.businessUsers(client.businessManagerId)
    },
    dolphinCloud: {
      businessManager: dolphinCloudLinks.businessManager(client.businessManagerId),
      adAccounts: client.adAccounts.map(account => ({
        name: account.name,
        url: dolphinCloudLinks.adAccount(account.id)
      }))
    },
    dolphinAnty: {
      dashboard: {
        desktop: dolphinAntyLinks.dashboard(),
        web: dolphinAntyLinks.webDashboard()
      },
      profiles: client.dolphinProfiles?.map(profile => ({
        name: profile.name,
        desktop: dolphinAntyLinks.launchProfile(profile.id),
        web: dolphinAntyLinks.webProfile(profile.id)
      })) || []
    }
  };
};

/**
 * Validate if external link is safe to open
 * Basic security check for allowed domains and protocols
 */
export const isAllowedExternalDomain = (url: string): boolean => {
  const allowedDomains = [
    'business.facebook.com',
    'facebook.com',
    'cloud.dolphin.tech',
    'anty.dolphin.tech',
    'ads.google.com',
    'google.com',
    'accounts.hkprovider.com', // Add your actual provider domain
    'hkprovider.com'
  ];
  
  const allowedProtocols = [
    'https:',
    'http:', // Only for localhost/development
    'dolphin-anty:', // Custom protocol for Dolphin Anty
    'dolphin-cloud:' // In case they add desktop app
  ];
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // For custom protocols, allow them (they're app-specific)
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return true;
    }
    
    // For web URLs, check domain
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * Check if desktop app is likely installed
 * This is a best-effort check that avoids triggering browser popups
 */
export const checkDesktopAppAvailable = async (protocol: string): Promise<boolean> => {
  // For now, we'll assume the app might be available but won't actively check
  // to avoid triggering browser popups. The openDesktopAppWithFallback function
  // will handle the fallback gracefully if the app isn't installed.
  
  // You could implement more sophisticated detection here, such as:
  // - Checking localStorage for previous successful app launches
  // - Using a less intrusive detection method
  // - Asking the user to manually indicate if they have the app installed
  
  return new Promise((resolve) => {
    // Check if we've successfully opened this app before
    const cacheKey = `desktop_app_${protocol}_available`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached === 'true') {
      resolve(true);
    } else if (cached === 'false') {
      resolve(false);
    } else {
      // Default to unknown (null will be handled by the UI)
      resolve(false);
    }
  });
}; 