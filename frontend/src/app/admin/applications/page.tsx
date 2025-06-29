"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicationAssetBindingDialog } from "@/components/admin/application-asset-binding-dialog";

interface Application {
  id: string;
  organization_id: string;
  organization_name: string;
  business_name: string;
  request_type: string;
  target_bm_dolphin_id?: string;
  website_url: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  fulfilled_by?: string;
  fulfilled_at?: string;
  client_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
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
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export default function AdminApplicationsPage() {
  const { session } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<RequestMode>('new-bm');
  const [existingBMs, setExistingBMs] = useState<BusinessManager[]>([]);

  // Fetch applications with SWR
  const { data: applicationsData, error, mutate, isLoading } = useSWR(
    '/api/admin/applications',
    fetcher,
    {
      refreshInterval: 5000, // Reduced to 5 seconds for more responsive updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000, // Reduced retry interval
      dedupingInterval: 1000, // Prevent duplicate requests
      focusThrottleInterval: 1000, // Throttle focus revalidation
    }
  );

  const applications = applicationsData?.applications || [];

  const handleApprove = async (application: Application) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }
    
    setProcessingId(application.id);
    
    // Immediate optimistic update - approve moves to processing (BlueFocus submission)
    const optimisticData = {
      ...applicationsData,
      applications: applications.map((app: Application) => 
        app.id === application.id 
          ? { ...app, status: 'processing' }
          : app
      )
    };
    
    // Update UI immediately
    mutate(optimisticData, false);
    
    try {
      const response = await fetch(`/api/admin/applications/${application.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_user_id: session.user.id
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        mutate();
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve application');
      }

      toast.success('Application approved successfully!');
      
      // Revalidate to ensure consistency
      setTimeout(() => mutate(), 500);
      
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error(`Failed to approve application: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert the optimistic update
      mutate();
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (application: Application) => {
    // Determine the request mode based on application data
    let mode: RequestMode = 'new-bm';
    let targetBmId: string | undefined;
    let existingBMsForOrg: BusinessManager[] = [];

    if (application.request_type) {
      switch (application.request_type) {
        case 'new_business_manager':
          mode = 'new-bm';
          break;
        case 'additional_accounts':
          if (application.target_bm_dolphin_id) {
            mode = 'additional-accounts-specific';
            targetBmId = application.target_bm_dolphin_id;
          } else {
            mode = 'additional-accounts-general';
            // Fetch existing BMs for this organization
            if (application.organization_id) {
              try {
                const response = await fetch(`/api/admin/organizations/${application.organization_id}/business-managers`);
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
    mutate(); // Refresh the applications list
    setSelectedApplication(null);
    setDialogOpen(false);
  };

  const handleReject = async (application: Application) => {
    if (!session?.user?.id) {
      toast.error('Authentication required');
      return;
    }
    
    setProcessingId(application.id);
    
    // Immediate optimistic update
    const optimisticData = {
      ...applicationsData,
      applications: applications.map((app: Application) => 
        app.id === application.id 
          ? { ...app, status: 'rejected' }
          : app
      )
    };
    
    // Update UI immediately
    mutate(optimisticData, false);
    
    try {
      const response = await fetch(`/api/admin/applications/${application.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_user_id: session.user.id
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        mutate();
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject application');
      }

      toast.success('Application rejected');
      
      // Revalidate to ensure consistency
      setTimeout(() => mutate(), 500);
      
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error(`Failed to reject application: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert the optimistic update
      mutate();
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getRequestTypeInfo = (application: Application) => {
    if (!application.request_type) {
      return { icon: <Building2 className="h-4 w-4" />, label: "New BM Request", variant: "default" as const };
    }

    switch (application.request_type) {
      case 'new_business_manager':
        return { icon: <Building2 className="h-4 w-4" />, label: "New Business Manager", variant: "default" as const };
      case 'additional_accounts':
        if (application.target_bm_dolphin_id) {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Specific BM)", variant: "secondary" as const };
        } else {
          return { icon: <Plus className="h-4 w-4" />, label: "Additional Accounts (Choose BM)", variant: "secondary" as const };
        }
      default:
        return { icon: <Building2 className="h-4 w-4" />, label: "Unknown Request", variant: "outline" as const };
    }
  };

  const filterApplications = (status: string) => {
    return applications.filter((app: Application) => app.status === status);
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
      <div className="flex justify-end">
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

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filterApplications('pending').length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({filterApplications('processing').length})
          </TabsTrigger>
          <TabsTrigger value="fulfilled">
            Fulfilled ({filterApplications('fulfilled').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterApplications('rejected').length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'processing', 'fulfilled', 'rejected'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterApplications(status).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No {status} applications found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterApplications(status).map((application: Application) => {
                  const requestTypeInfo = getRequestTypeInfo(application);
                  return (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {application.organization_name}
                            </CardTitle>
                            <CardDescription>
                              Website: {application.website_url}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={requestTypeInfo.variant}>
                                <div className="flex items-center gap-1">
                                  {requestTypeInfo.icon}
                                  {requestTypeInfo.label}
                                </div>
                              </Badge>
                              {application.target_bm_dolphin_id && (
                                <Badge variant="outline" className="text-xs">
                                  Target BM: {application.target_bm_dolphin_id}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(application.status)}
                            {getStatusBadge(application.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Applied: {formatDate(application.created_at)}
                          </div>
                          <div className="flex gap-2">
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(application)}
                                  disabled={processingId === application.id}
                                >
                                  {processingId === application.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Reject'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(application)}
                                  disabled={processingId === application.id}
                                >
                                  {processingId === application.id ? (
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ApplicationAssetBindingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApplication}
        mode={dialogMode}
        targetBmId={selectedApplication?.target_bm_dolphin_id}
        existingBMs={existingBMs}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
} 