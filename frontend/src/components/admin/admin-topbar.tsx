"use client";

import React, { useState } from 'react';
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
import { ExternalLink, Shield, User, Settings, Moon, Sun, Monitor, LogOut, Crown, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlaceholderUrl } from '@/lib/config/assets';
import { GlobalSearch } from './global-search';

interface AdminTopbarProps {
  pageTitle?: string;
}

export function AdminTopbar({ pageTitle }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut: authSignOut } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const userEmail = user?.email || 'admin@adhub.com';
  const userInitial = user?.email?.charAt(0).toUpperCase() || "A";

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
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>
            }
          />
        </div>
        
        {/* Removed notification bell - was fake/non-functional */}

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.avatar_url || user?.user_metadata?.avatar_url || undefined} alt="Admin" />
                <AvatarFallback className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-white">
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
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">System Administrator</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              {/* Removed Admin Profile and System Settings - these pages don't exist */}
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2" onClick={(e) => e.preventDefault()}>
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
                className="text-popover-foreground hover:bg-accent px-4 py-2"
                onClick={() => (window.location.href = "/dashboard")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Switch to Client View
              </DropdownMenuItem>
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>

            <div className="p-2 border-t border-border">
              <Button
                className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0 w-full"
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