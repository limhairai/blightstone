"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface DolphinHealthStatus {
  status: 'healthy' | 'unhealthy' | 'error' | 'partial';
  message: string;
  api_configured: boolean;
  base_url: string;
  timestamp: string;
  backend_status: string;
  auth_status: string;
}

export function DolphinStatusCard() {
  const { session } = useAuth();
  const [healthStatus, setHealthStatus] = useState<DolphinHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/dolphin-health', {
        headers,
      });
      
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Error checking Dolphin health:', error);
      toast.error('Failed to check Dolphin API status');
      setHealthStatus({
        status: 'error',
        message: 'Failed to check status',
        api_configured: false,
        base_url: '',
        timestamp: new Date().toISOString(),
        backend_status: 'unknown',
        auth_status: 'unknown'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [session]);

  const getStatusBadge = () => {
    if (!healthStatus) return null;

    const config = {
      healthy: { label: 'Connected & Authenticated', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      partial: { label: 'Connected (No Auth)', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      unhealthy: { label: 'Authentication Failed', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
      error: { label: 'Connection Error', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' }
    };

    const statusConfig = config[healthStatus.status];
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Dolphin Cloud Integration</CardTitle>
            <CardDescription>
              Facebook asset management via backend Dolphin service
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking status...
          </div>
        ) : healthStatus ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Backend API:</span>
                <div className="text-muted-foreground">{healthStatus.base_url}</div>
              </div>
              <div>
                <span className="font-medium">Backend Status:</span>
                <div className="text-muted-foreground">
                  {healthStatus.backend_status === 'connected' ? '✓ Connected' : '❌ Disconnected'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Authentication:</span>
                <div className="text-muted-foreground">
                  {healthStatus.auth_status === 'authenticated' ? '✓ Authenticated' : 
                   healthStatus.auth_status === 'no_token' ? '⚠️ No token' :
                   healthStatus.auth_status === 'auth_failed' ? '❌ Auth failed' : '❓ Unknown'}
                </div>
              </div>
              <div>
                <span className="font-medium">Dolphin Ready:</span>
                <div className="text-muted-foreground">
                  {healthStatus.status === 'healthy' ? '✓ Ready' : '❌ Not ready'}
                </div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-sm">Status:</span>
              <div className="text-sm text-muted-foreground mt-1">
                {healthStatus.message}
              </div>
            </div>

            {healthStatus.status !== 'healthy' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800">Setup Required</div>
                    <div className="text-yellow-700 mt-1">
                      {healthStatus.auth_status === 'no_token' ? 
                        'Please ensure you are logged in as an admin user.' :
                        healthStatus.auth_status === 'auth_failed' ?
                        'Authentication failed. Please check your admin permissions.' :
                        'Backend connection or Dolphin API configuration issue.'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={checkHealth}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
              
              <Badge variant="secondary" className="text-xs">
                Last checked: {new Date(healthStatus.timestamp).toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Unable to check Dolphin API status
          </div>
        )}
      </CardContent>
    </Card>
  );
} 