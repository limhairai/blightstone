"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Bell, ExternalLink, Shield, User, Settings, Moon, Sun, Monitor, LogOut, Crown, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPlaceholderUrl } from '@/lib/config/assets';

interface AdminTopbarProps {
  pageTitle?: string;
}

export function AdminTopbar({ pageTitle }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut: authSignOut } = useAuth();
  
  const hasNotifications = true;
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
    <div className="sticky top-0 z-50 h-16 border-b border-border/20 flex items-center justify-between px-3 md:px-4 bg-card/80 backdrop-blur-md">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 ml-4">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>

      {/* Right: Admin Controls */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative hover:bg-accent">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {hasNotifications && (
            <>
              <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-600 hover:bg-red-700 text-white border-2 border-background"
              >
                90+
              </Badge>
            </>
          )}
        </Button>

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src="getPlaceholderUrl()?height=32&width=32&text=A" alt="Admin" />
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
              <DropdownMenuItem
                className="text-popover-foreground hover:bg-accent px-4 py-2"
                onClick={() => (window.location.href = "/admin/settings/account")}
              >
                <User className="h-4 w-4 mr-2" />
                Admin Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-popover-foreground hover:bg-accent px-4 py-2"
                onClick={() => (window.location.href = "/admin/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="py-2">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent px-4 py-2">
                <Moon className="h-4 w-4 mr-2" />
                Theme
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                    <Monitor className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm">
                    <Sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm bg-accent">
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