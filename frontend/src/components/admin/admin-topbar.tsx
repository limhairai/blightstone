"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, Settings, LogOut, User, Shield, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface AdminTopBarProps {
  user: any;
}

export function AdminTopBar({ user }: AdminTopBarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname === '/admin/applications') return 'Applications';
    if (pathname === '/admin/organizations') return 'Organizations';
    if (pathname === '/admin/businesses') return 'Businesses';
    if (pathname === '/admin/infrastructure') return 'Infrastructure';
    if (pathname === '/admin/assets') return 'Assets';
    if (pathname === '/admin/workflow') return 'Workflow';
    if (pathname === '/admin/finances') return 'Finances';
    if (pathname === '/admin/analytics') return 'Analytics';
    if (pathname === '/admin/settings') return 'Settings';
    return 'Admin Panel';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left Section - Page Title & Breadcrumb */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Admin
            </Link>
            {pathname !== '/admin' && (
              <>
                <span>/</span>
                <span className="text-foreground">{getPageTitle()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, businesses, accounts..."
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Right Section - Actions & User Menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            3
          </Badge>
        </Button>

        {/* Quick Actions */}
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Exit Admin
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} alt={user?.name || user?.email} />
                <AvatarFallback className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] text-black">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <Badge 
                variant="secondary" 
                className="absolute -bottom-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
              >
                <Shield className="h-3 w-3" />
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Super Admin</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 