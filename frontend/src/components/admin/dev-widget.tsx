"use client"

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Settings, Database, RefreshCw, Zap } from 'lucide-react';
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext';

export function DevWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useAuth();

  const handleCreateTestAssets = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth token found');
      }

      const response = await fetch('/api/admin/create-test-assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test assets');
      }

      toast.success(data.message);

    } catch (error) {
      console.error('Error creating test assets:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create test assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete ALL data!')) {
      return;
    }

    setIsLoading(true);
    try {
      // This would need to be implemented as an API endpoint
      toast.info("Database reset functionality not implemented yet");
    } catch (error) {
      toast.error("Failed to reset database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupData = async () => {
    if (!confirm('Are you sure you want to clean up orphaned data? This will remove invalid bindings and duplicate applications.')) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth token found');
      }

      const response = await fetch('/api/admin/cleanup-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cleanup data');
      }

      toast.success(`Removed ${data.results.orphaned_bindings_removed} orphaned bindings, ${data.results.duplicate_applications_removed} duplicate applications, ${data.results.invalid_assets_removed} invalid assets`);

    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="rounded-full w-12 h-12 p-0 bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-gray-900 border-purple-600 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-400" />
              <CardTitle className="text-sm">Dev Tools</CardTitle>
              <Badge variant="secondary" className="text-xs bg-purple-600">
                DEV
              </Badge>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Database</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCreateTestAssets}
                disabled={isLoading}
                size="sm"
                className="justify-start h-8 bg-green-600 hover:bg-green-700 text-white"
              >
                <Database className="h-3 w-3 mr-2" />
                {isLoading ? 'Creating...' : 'Create Test Assets'}
              </Button>
              <Button
                onClick={handleCleanupData}
                disabled={isLoading}
                size="sm"
                className="justify-start h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Zap className="h-3 w-3 mr-2" />
                {isLoading ? 'Cleaning...' : 'Cleanup Data'}
              </Button>
              <Button
                onClick={handleResetDatabase}
                disabled={isLoading}
                size="sm"
                variant="destructive"
                className="justify-start h-8"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Reset Database
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Page</p>
            <Button
              onClick={handleRefreshPage}
              size="sm"
              variant="outline"
              className="justify-start h-8 w-full"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Refresh Page
            </Button>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Only visible to superusers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 