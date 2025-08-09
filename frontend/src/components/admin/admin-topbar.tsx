"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ExternalLink, Shield, User, Settings, Moon, Sun, Monitor, LogOut, Crown, Menu, X, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlaceholderUrl } from '@/lib/config/assets';
import { GlobalSearch } from './global-search';
import { gradientTokens } from '../../lib/design-tokens';

interface AdminTopbarProps {
  pageTitle?: string;
}

export function AdminTopbar({ pageTitle }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut: authSignOut, session } = useAuth();
  const { theme, setTheme } = useTheme();
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const userEmail = user?.email || 'admin@blightstone.com';
  const userInitial = user?.email?.charAt(0).toUpperCase() || "A";

  // Get last sync time from localStorage and check for recent sync activity
  useEffect(() => {
    const getLastSyncTime = () => {
      // Check localStorage for last sync time
      const stored = localStorage.getItem('admin_last_sync_time');
      if (stored) {
        setLastSyncTime(stored);
      }
    };

    // Initial load
    getLastSyncTime();

    // Listen for sync events from other parts of the app
    const handleSyncEvent = (event: CustomEvent) => {
      const syncTime = new Date().toISOString();
      localStorage.setItem('admin_last_sync_time', syncTime);
      setLastSyncTime(syncTime);
    };

    // Listen for custom sync events
    window.addEventListener('admin-sync-completed', handleSyncEvent as EventListener);
    
    // Check for updates every 30 seconds (just read from localStorage, no API calls)
    const interval = setInterval(getLastSyncTime, 30000);

    return () => {
      window.removeEventListener('admin-sync-completed', handleSyncEvent as EventListener);
      clearInterval(interval);
    };
  }, []);

  // Get page title from pathname if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    if (!pathname) return "Admin Dashboard";

    const pathSegments = pathname.split("/").filter(Boolean);
    // Use the second to last segment for sub-pages, or the last for main pages
    const relevantSegment = pathSegments.length > 2 ? pathSegments[pathSegments.length - 2] : pathSegments[pathSegments.length - 1];

    if (!relevantSegment) return "Admin Dashboard";

    // Format the title: 'business-managers' -> 'Business Managers'
    return relevantSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format last sync time
  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border/20 flex items-center justify-between px-3 md:px-6 bg-card/80 backdrop-blur-md">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>

      {/* Center: Global Search */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md hidden md:block">
        <GlobalSearch />
      </div>

      {/* Right: Admin Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search Button */}
        <div className="md:hidden">
          <GlobalSearch 
            trigger={
              <Button variant="ghost" size="icon" className="hover:bg-[#F5F5F5]">
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>
            }
          />
        </div>
        
        {/* Last Autosync Timestamp */}
        {lastSyncTime && (
          <span className="text-sm text-muted-foreground">
            Last Sync: {formatLastSync(lastSyncTime)}
          </span>
        )}

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#F5F5F5]">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.avatar_url || user?.user_metadata?.avatar_url || undefined} alt="Admin" />
                <AvatarFallback className={gradientTokens.avatar}>
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover border-border p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-popover-foreground">{userEmail}</p>
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">System Administrator</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              {/* Removed Admin Profile and System Settings - these pages don't exist */}
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-[#F5F5F5] px-4 py-2" onClick={(e) => e.preventDefault()}>
                <Moon className="h-4 w-4 mr-2" />
                Theme
                <div className="ml-auto flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'system' ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'light' ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 rounded-sm ${theme === 'dark' ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem
                className="text-popover-foreground hover:bg-[#F5F5F5] px-4 py-2"
                onClick={() => (window.location.href = "/dashboard")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Switch to Client View
              </DropdownMenuItem>
              <DropdownMenuItem className="text-popover-foreground hover:bg-[#F5F5F5] px-4 py-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>

            <div className="p-2 border-t border-border">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-full"
                size="sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 