"use client"

import { Button } from "../ui/button";
import { ExternalLink, AlertTriangle, Monitor, Globe, CreditCard, Users, Settings } from "lucide-react";
import { 
  isAllowedExternalDomain, 
  openExternalLink, 
  openDesktopAppWithFallback,
  checkDesktopAppAvailable 
} from "../../lib/external-links";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";

interface ExternalLinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
  className?: string;
  trackingData?: Record<string, any>;
  showExternalIcon?: boolean;
  disabled?: boolean;
  desktopFallback?: string; // Web fallback URL for desktop apps
}

export function ExternalLinkButton({
  href,
  children,
  variant = "outline",
  size = "sm",
  className,
  trackingData,
  showExternalIcon = true,
  disabled = false,
  desktopFallback
}: ExternalLinkButtonProps) {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  const [desktopAppAvailable, setDesktopAppAvailable] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if this is a desktop app link
    if (href.includes('://') && !href.startsWith('http')) {
      setIsDesktopApp(true);
      // Don't automatically check app availability - only check when user interacts
    }
  }, [href]);
  
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Security check
    if (!isAllowedExternalDomain(href)) {
      setShowSecurityWarning(true);
      return;
    }
    
    // Handle desktop app with fallback
    if (isDesktopApp && desktopFallback) {
      // Check app availability only when user clicks (if not already checked)
      if (desktopAppAvailable === null) {
        const protocol = href.split('://')[0];
        const isAvailable = await checkDesktopAppAvailable(protocol);
        setDesktopAppAvailable(isAvailable);
      }
      
      openDesktopAppWithFallback(href, desktopFallback, {
        source: 'admin_panel',
        ...trackingData
      });
    } else {
      // Regular web link
      openExternalLink(href, {
        source: 'admin_panel',
        ...trackingData
      });
    }
  };

  if (showSecurityWarning) {
    return (
      <div className="space-y-2">
        <Alert className="border-border bg-red-50">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-muted-foreground">
            This external link is not allowed for security reasons.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowSecurityWarning(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
        {showExternalIcon && (
          isDesktopApp ? 
            <Monitor className="h-3 w-3 ml-1" /> : 
            <ExternalLink className="h-3 w-3 ml-1" />
        )}
      </Button>
      
      {/* Show desktop app status only after user interaction */}
      {isDesktopApp && desktopAppAvailable !== null && (
        <Badge variant={desktopAppAvailable ? "default" : "secondary"} className="text-xs">
          {desktopAppAvailable ? "App Available" : "Web Fallback"}
        </Badge>
      )}
    </div>
  );
}

/**
 * Pre-configured external link buttons for common platforms
 */
export function FacebookBMButton({ 
  businessManagerId, 
  children = "Open Business Manager",
  ...props 
}: { businessManagerId: string; children?: React.ReactNode } & Omit<ExternalLinkButtonProps, 'href'>) {
  return (
    <ExternalLinkButton
      href={`https://business.facebook.com/settings/accounts?business_id=${businessManagerId}`}
      trackingData={{ platform: 'facebook', type: 'business_manager', bmId: businessManagerId }}
      {...props}
    >
      <Globe className="h-3 w-3 mr-1" />
      {children}
    </ExternalLinkButton>
  );
}

export function FacebookAdAccountButton({ 
  adAccountId, 
  businessManagerId,
  children = "Open Ad Account",
  ...props 
}: { 
  adAccountId: string; 
  businessManagerId?: string; 
  children?: React.ReactNode;
} & Omit<ExternalLinkButtonProps, 'href'>) {
  const baseUrl = `https://business.facebook.com/adsmanager/manage/accounts?act=${adAccountId}`;
  const href = businessManagerId ? `${baseUrl}&business_id=${businessManagerId}` : baseUrl;
  
  return (
    <ExternalLinkButton
      href={href}
      trackingData={{ 
        platform: 'facebook', 
        type: 'ad_account', 
        adAccountId, 
        businessManagerId 
      }}
      {...props}
    >
      <CreditCard className="h-3 w-3 mr-1" />
      {children}
    </ExternalLinkButton>
  );
}

export function DolphinCloudButton({ 
  path = '/dashboard',
  children = "Open Dolphin Cloud",
  ...props 
}: { path?: string; children?: React.ReactNode } & Omit<ExternalLinkButtonProps, 'href'>) {
  return (
    <ExternalLinkButton
      href={`https://cloud.dolphin.tech${path}`}
      trackingData={{ platform: 'dolphin_cloud', path }}
      {...props}
    >
      <Globe className="h-3 w-3 mr-1" />
      {children}
    </ExternalLinkButton>
  );
}

export function DolphinAntyButton({ 
  path = '/dashboard',
  profileId,
  children = "Open Dolphin Anty",
  preferDesktop = true,
  ...props 
}: { 
  path?: string; 
  profileId?: string;
  children?: React.ReactNode;
  preferDesktop?: boolean;
} & Omit<ExternalLinkButtonProps, 'href' | 'desktopFallback'>) {
  
  // Generate desktop and web URLs
  const desktopUrl = profileId 
    ? `dolphin-anty://launch/${profileId}`
    : `dolphin-anty://${path.replace('/', '')}`;
  
  const webUrl = profileId
    ? `https://anty.dolphin.tech/profiles/${profileId}`
    : `https://anty.dolphin.tech${path}`;
  
  return (
    <ExternalLinkButton
      href={preferDesktop ? desktopUrl : webUrl}
      desktopFallback={preferDesktop ? webUrl : undefined}
      trackingData={{ 
        platform: 'dolphin_anty', 
        path, 
        profileId,
        preferDesktop 
      }}
      {...props}
    >
      {preferDesktop ? <Monitor className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
      {children}
    </ExternalLinkButton>
  );
}

export function AccountProviderButton({ 
  path = '/dashboard',
  applicationId,
  children = "Open Provider Portal",
  ...props 
}: { 
  path?: string; 
  applicationId?: string;
  children?: React.ReactNode;
} & Omit<ExternalLinkButtonProps, 'href'>) {
  
  const href = applicationId 
    ? `https://accounts.hkprovider.com/applications/${applicationId}`
    : `https://accounts.hkprovider.com${path}`;
  
  return (
    <ExternalLinkButton
      href={href}
      trackingData={{ 
        platform: 'account_provider', 
        path,
        applicationId 
      }}
      {...props}
    >
      <Users className="h-3 w-3 mr-1" />
      {children}
    </ExternalLinkButton>
  );
}

/**
 * Multi-option button for platforms with both desktop and web options
 */
export function DolphinAntyMultiButton({ 
  profileId,
  profileName = "Profile",
  ...props 
}: { 
  profileId?: string;
  profileName?: string;
} & Omit<ExternalLinkButtonProps, 'href' | 'children'>) {
  
  return (
    <div className="flex items-center gap-1">
      <DolphinAntyButton
        profileId={profileId}
        preferDesktop={true}
        size="sm"
        variant="outline"
        {...props}
      >
        Launch {profileName}
      </DolphinAntyButton>
      
      <DolphinAntyButton
        profileId={profileId}
        preferDesktop={false}
        size="sm"
        variant="ghost"
        showExternalIcon={false}
        {...props}
      >
        <Globe className="h-3 w-3" />
      </DolphinAntyButton>
    </div>
  );
} 