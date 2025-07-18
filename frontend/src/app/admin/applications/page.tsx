"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import useSWR from 'swr';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminInstantButton } from "@/components/ui/admin-instant-button";
import { useAdminPerformance, useInstantAdminTable } from "@/lib/admin-performance";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Building2, Plus, History, Globe } from "lucide-react";
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
  domains?: string[]; // Add domains array
  pixelId?: string;
  pixelName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;

  // User profiles
  approvedByProfile?: { name: string; email: string };
  rejectedByProfile?: { name: string; email: string };
  fulfilledByProfile?: { name: string; email: string };

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
  const { performInstantAdminAction, updateAdminDataOptimistically } = useAdminPerformance();
  const { selectedRows, toggleRowSelection, performBulkAction } = useInstantAdminTable();
  
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<RequestMode>('new-bm');
  const [existingBMs, setExistingBMs] = useState<BusinessManager[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [applicationToApprove, setApplicationToApprove] = useState<ApplicationWithDetails | null>(null);

  // Fetch applications with SWR (only pending and processing)
  const { data: applicationsData, error, mutate, isLoading } = useSWR(
    '/api/admin/applications?status=pending,processing',
    fetcher
    // Using global SWR config for consistency
  );

  const applications = applicationsData?.applications || [];

  const handleApprove = (application: ApplicationWithDetails) => {
    setApplicationToApprove(application);
    setConfirmDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (!session?.user?.id || !applicationToApprove) {
      toast.error('Authentication required');
      return;
    }

    setConfirmDialogOpen(false);

    // Optimistic update
    const optimisticData = applications.map((app: ApplicationWithDetails) => 
      app.applicationId === applicationToApprove.applicationId 
        ? { ...app, status: 'processing', approvedBy: session.user.id, approvedAt: new Date().toISOString() }
        : app
    );

    await updateAdminDataOptimistically(
      '/api/admin/applications?status=pending,processing',
      { applications: optimisticData },
      async () => {
        const response = await fetch(`/api/admin/applications/${applicationToApprove.applicationId}/approve`, {
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

        return response.json();
      }
    );

    toast.success('Application approved successfully');
    setApplicationToApprove(null);
  };

  const handleReject = async (application: ApplicationWithDetails) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }

    // Optimistic update
    const optimisticData = applications.map((app: ApplicationWithDetails) => 
      app.applicationId === application.applicationId 
        ? { ...app, status: 'rejected', rejectedBy: session.user.id, rejectedAt: new Date().toISOString() }
        : app
    );

    await updateAdminDataOptimistically(
      '/api/admin/applications?status=pending,processing',
      { applications: optimisticData },
      async () => {
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

        return response.json();
      }
    );

    toast.success('Application rejected successfully');
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
        case 'pixel_connection':
          // For pixel connections, we can fulfill them directly
          await handlePixelConnectionFulfillment(application);
          return;
      }
    }

    setSelectedApplication(application);
    setDialogMode(mode);
    setExistingBMs(existingBMsForOrg);
    setDialogOpen(true);
  };

  const handlePixelConnectionFulfillment = async (application: ApplicationWithDetails) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }

    setProcessingId(application.applicationId);

    try {
      const response = await fetch(`/api/admin/applications/${application.applicationId}/fulfill-pixel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_user_id: session.user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fulfill pixel connection');
      }

      const result = await response.json();
      
      toast.success('Pixel connection fulfilled successfully!', {
        description: `Pixel ${application.pixelId} has been connected to the business manager.`
      });
      
      // Refresh the applications list
      mutate();
      
    } catch (error) {
      console.error('Error fulfilling pixel connection:', error);
      toast.error('Failed to fulfill pixel connection', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDialogSuccess = async () => {
    // Show success message
    toast.success('Application fulfilled successfully');
    
    // Simple cache refresh - let SWR handle the rest
    mutate();
    
    setSelectedApplication(null);
    setDialogOpen(false);
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
      case 'pixel_connection':
        return { icon: <Globe className="h-4 w-4" />, label: "Pixel Connection", variant: "destructive" as const };
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
            <AdminInstantButton
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/admin/applications/history'}
              action="Navigating to history"
            >
              <History className="h-4 w-4 mr-2" />
              View History
            </AdminInstantButton>
            <AdminInstantButton
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
              action="Refreshing data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </AdminInstantButton>
          </div>
        </div>

        {['pending', 'processing'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterApplications(status).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {status} applications found.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-muted-foreground">Organization</TableHead>
                      <TableHead className="text-muted-foreground">Request Type</TableHead>
                      <TableHead className="text-muted-foreground">Details</TableHead>
                      <TableHead className="text-muted-foreground">Applied</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterApplications(status).map((application: ApplicationWithDetails) => {
                      const requestTypeInfo = getRequestTypeInfo(application);
                      const isProcessing = processingId === application.applicationId;
                      
                      return (
                        <TableRow key={application.applicationId} className="admin-table-row border-border hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                                {requestTypeInfo.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{application.organizationName}</div>
                                <div className="text-sm text-muted-foreground truncate">{application.websiteUrl}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
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
                              {application.requestType === 'pixel_connection' && application.pixelId && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  Pixel ID: {application.pixelId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1 max-w-xs">
                              {application.requestType === 'pixel_connection' ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-foreground">
                                    <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium truncate">
                                      {application.pixelName || `Pixel ${application.pixelId}`}
                                    </span>
                                  </div>
                                  {application.targetBmDolphinId && (
                                    <div className="text-xs text-muted-foreground">
                                      → BM: {application.targetBmDolphinId}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {application.domains && application.domains.length > 0 ? (
                                    <>
                                      {application.domains.map((domain, index) => (
                                        <div key={index} className="flex items-center gap-1 text-xs text-foreground">
                                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          <span className="truncate">{domain}</span>
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Globe className="h-3 w-3" />
                                      <span className="truncate">{application.websiteUrl}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">{formatDate(application.createdAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${
                                  application.status === 'pending' ? 'bg-yellow-500' :
                                  application.status === 'processing' ? 'bg-blue-500' :
                                  application.status === 'fulfilled' ? 'bg-green-500' :
                                  'bg-red-500'
                                }`} />
                                <span className="text-xs font-medium capitalize">{application.status}</span>
                              </div>
                              {application.status === 'processing' && application.approvedByProfile && (
                                <div className="text-xs text-muted-foreground">
                                  Approved by {application.approvedByProfile.name}
                                </div>
                              )}
                              {application.status === 'fulfilled' && application.fulfilledByProfile && (
                                <div className="text-xs text-muted-foreground">
                                  Fulfilled by {application.fulfilledByProfile.name}
                                </div>
                              )}
                              {application.status === 'rejected' && application.rejectedByProfile && (
                                <div className="text-xs text-muted-foreground">
                                  Rejected by {application.rejectedByProfile.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {application.status === 'pending' && (
                                <>
                                  <AdminInstantButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReject(application)}
                                    action="Rejecting application"
                                  >
                                    Reject
                                  </AdminInstantButton>
                                  <AdminInstantButton
                                    size="sm"
                                    onClick={() => handleApprove(application)}
                                    action="Approving application"
                                    style={{
                                      background: 'linear-gradient(90deg, #b4a0ff 0%, #ffb4a0 100%)',
                                      color: 'black',
                                      border: 'none'
                                    }}
                                    className="hover:opacity-90"
                                  >
                                    Approve
                                  </AdminInstantButton>
                                </>
                              )}
                              {application.status === 'processing' && (
                                <AdminInstantButton
                                  size="sm"
                                  onClick={() => handleFulfill(application)}
                                  action="Marking as fulfilled"
                                  className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                                  disabled={processingId === application.applicationId}
                                >
                                  {processingId === application.applicationId ? 'Processing...' : 'Mark as Fulfilled'}
                                </AdminInstantButton>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ApplicationAssetBindingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApplication ? {
          ...selectedApplication,
          organization_name: selectedApplication.organizationName,
          business_name: selectedApplication.businessName,
          target_bm_id: selectedApplication.targetBmDolphinId
        } : null}
        mode={dialogMode}
        targetBmId={selectedApplication?.targetBmDolphinId}
        existingBMs={existingBMs}
        onSuccess={handleDialogSuccess}
      />

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this business manager application for{' '}
              <strong>{applicationToApprove?.organizationName}</strong>?
              <br />
              <br />
              This action will move the application to &quot;Processing&quot; status. Your team will need to manually apply to BlueFocus on behalf of the client to begin provisioning the business manager.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === applicationToApprove?.applicationId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={processingId === applicationToApprove?.applicationId}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
            >
              {processingId === applicationToApprove?.applicationId ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Yes, Approve Application'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 