"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import useSWR from 'swr';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Building2, Plus, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicationAssetBindingDialog } from "@/components/admin/application-asset-binding-dialog";
import { Application } from "@/types/generated/semantic-ids";
import { cn } from "@/lib/utils";

// Extended Application interface for this page's needs (camelCase API response)
interface ApplicationWithDetails extends Application {
  organizationName: string;
  businessName: string;
  requestType: string;
  targetBmDolphinId?: string;
  websiteUrl: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface BusinessManager {
  id: string;
  name: string;
  asset_id: string;
  current_account_count: number;
}

type RequestMode = 'new-bm' | 'additional-accounts-specific' | 'additional-accounts-general';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export default function AdminApplicationsPage() {
  const { session } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<RequestMode>('new-bm');
  const [existingBMs, setExistingBMs] = useState<BusinessManager[]>([]);

  // Fetch applications with SWR (only pending and processing)
  const { data: applicationsData, error, mutate, isLoading } = useSWR(
    '/api/admin/applications?status=pending,processing',
    fetcher,
    {
      refreshInterval: 0, // No automatic polling - manual refresh only
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when connection is restored
      revalidateOnMount: true, // Always get fresh data on mount
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 5 * 1000, // Reduced to 5 seconds for immediate responsiveness
      focusThrottleInterval: 1000,
    }
  );

  const applications = applicationsData?.applications || [];

  const handleApprove = async (application: ApplicationWithDetails) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }

    // OPTIMISTIC UPDATE: Immediately update the UI
    const optimisticApplication = {
      ...application,
      status: 'processing' as const,

      updated_at: new Date().toISOString()
    };

    // Update cache immediately
    mutate(
      (data: any) => {
        if (!data?.applications) return data;
        return {
          ...data,
          applications: data.applications.map((app: ApplicationWithDetails) =>
            app.applicationId === application.applicationId ? optimisticApplication : app
          )
        };
      },
      { revalidate: false }
    );

    // Show success immediately
    toast.success('Application approved successfully');

    setProcessingId(application.applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${application.applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_user_id: session.user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      // Sync with server data (background update)
      mutate();
    } catch (error) {
      console.error('Error approving application:', error);
      // Revert optimistic update on error
      mutate();
      toast.error('Failed to approve application - reverted');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (application: ApplicationWithDetails) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }

    // OPTIMISTIC UPDATE: Immediately update the UI
    const optimisticApplication = {
      ...application,
      status: 'rejected' as const,

      updated_at: new Date().toISOString()
    };

    // Update cache immediately
    mutate(
      (data: any) => {
        if (!data?.applications) return data;
        return {
          ...data,
          applications: data.applications.map((app: ApplicationWithDetails) =>
            app.applicationId === application.applicationId ? optimisticApplication : app
          )
        };
      },
      { revalidate: false }
    );

    // Show success immediately
    toast.success('Application rejected successfully');

    setProcessingId(application.applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${application.applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_user_id: session.user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      // Sync with server data (background update)
      mutate();
    } catch (error) {
      console.error('Error rejecting application:', error);
      // Revert optimistic update on error
      mutate();
      toast.error('Failed to reject application - reverted');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (application: ApplicationWithDetails) => {
    // Determine the request mode based on application data
    let mode: RequestMode = 'new-bm';
    let targetBmId: string | undefined;
    let existingBMsForOrg: BusinessManager[] = [];

    if (application.requestType) {
      switch (application.requestType) {
        case 'new_business_manager':
          mode = 'new-bm';
          break;
        case 'additional_accounts':
          if (application.targetBmDolphinId) {
            mode = 'additional-accounts-specific';
            targetBmId = application.targetBmDolphinId;
          } else {
            mode = 'additional-accounts-general';
            // Fetch existing BMs for this organization
            if (application.organizationId) {
              try {
                const response = await fetch(`/api/admin/organizations/${application.organizationId}/business-managers`);
                if (response.ok) {
                  const data = await response.json();
                  existingBMsForOrg = data.business_managers || [];
                }
              } catch (error) {
                console.error('Failed to fetch existing BMs:', error);
              }
            }
          }
          break;
      }
    }

    setSelectedApplication(application);
    setDialogMode(mode);
    setExistingBMs(existingBMsForOrg);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    // Show success message
    toast.success('Application fulfilled successfully');
    
    // Force immediate refresh with cache bypass
    mutate(undefined, { revalidate: true });
    setSelectedApplication(null);
    setDialogOpen(false);
    
    // Additional refresh after a short delay to ensure consistency
    setTimeout(() => {
      mutate(undefined, { revalidate: true });
    }, 1000);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: "Pending", 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800", 
        icon: Clock, 
        color: "text-[#FFC857]" 
      },
      processing: { 
        label: "Processing", 
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", 
        icon: AlertCircle, 
        color: "text-blue-500" 
      },
      fulfilled: { 
        label: "Fulfilled", 
        className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", 
        icon: CheckCircle, 
        color: "text-[#34D197]" 
      },
      rejected: { 
        label: "Rejected", 
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", 
        icon: AlertCircle, 
        color: "text-[#F56565]" 
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;
    return (
      <Badge className={cn("border", statusConfig.className)}>
        <StatusIcon className={cn("h-3 w-3 mr-1", statusConfig.color)} />
        {statusConfig.label}
      </Badge>
    );
  };

  const getRequestTypeInfo = (application: ApplicationWithDetails) => {
    if (!application.requestType) {
      return { icon: <Building2 className="h-4 w-4" />, label: "New BM Request", variant: "default" as const };
    }

    switch (application.requestType) {
      case 'new_business_manager':
        return { icon: <Building2 className="h-4 w-4" />, label: "New Business Manager", variant: "default" as const };
      case 'additional_accounts':
        if (application.targetBmDolphinId) {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Specific BM)", variant: "secondary" as const };
        } else {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Choose BM)", variant: "secondary" as const };
        }
      default:
        return { icon: <Building2 className="h-4 w-4" />, label: "Unknown Request", variant: "outline" as const };
    }
  };

  const filterApplications = (status: string) => {
    return applications.filter((app: ApplicationWithDetails) => app.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createColumns = (statusFilter: string) => [
    {
      accessorKey: "organizationName",
      header: "Organization",
      size: 250,
      cell: ({ row }: { row: { original: ApplicationWithDetails } }) => {
        const application = row.original;
        const requestTypeInfo = getRequestTypeInfo(application);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
              {requestTypeInfo.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{application.organizationName}</div>
              <div className="text-sm text-muted-foreground truncate">{application.websiteUrl}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "requestType",
      header: "Request Type",
      size: 200,
      cell: ({ row }: { row: { original: ApplicationWithDetails } }) => {
        const application = row.original;
        const requestTypeInfo = getRequestTypeInfo(application);
        return (
          <div className="space-y-1">
            <Badge variant={requestTypeInfo.variant}>
              <div className="flex items-center gap-1">
                {requestTypeInfo.icon}
                {requestTypeInfo.label}
              </div>
            </Badge>
            {application.targetBmDolphinId && (
              <div className="text-xs text-muted-foreground font-mono">
                Target: {application.targetBmDolphinId}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Applied",
      size: 150,
      cell: ({ row }: { row: { original: ApplicationWithDetails } }) => (
        <div className="text-sm">{formatDate(row.original.createdAt)}</div>
      ),
    },
    // Only show status column if we're showing all statuses
    ...(statusFilter === 'all' ? [{
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }: { row: { original: ApplicationWithDetails } }) => 
        getStatusBadge(row.original.status),
    }] : []),
    {
      accessorKey: "actions",
      header: "Actions",
      size: 200,
      cell: ({ row }: { row: { original: ApplicationWithDetails } }) => {
        const application = row.original;
        const isProcessing = processingId === application.applicationId;
        
        return (
          <div className="flex gap-2">
            {application.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(application)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Reject'
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(application)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Approve'
                  )}
                </Button>
              </>
            )}
            {application.status === 'processing' && (
              <Button
                size="sm"
                onClick={() => handleFulfill(application)}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark as Fulfilled
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading applications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        Failed to load applications: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterApplications('pending').length})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({filterApplications('processing').length})
            </TabsTrigger>

          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/admin/applications/history'}
            >
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {['pending', 'processing'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterApplications(status).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {status} applications found.
              </div>
            ) : (
              <DataTable 
                columns={createColumns(status)} 
                data={filterApplications(status)} 
                searchKey="organizationName"
                searchPlaceholder="Search applications..."
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ApplicationAssetBindingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApplication}
        mode={dialogMode}
        targetBmId={selectedApplication?.targetBmDolphinId}
        existingBMs={existingBMs}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
} 