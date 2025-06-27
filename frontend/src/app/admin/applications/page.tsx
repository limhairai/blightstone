"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from "react";
import useSWR from 'swr';
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../../../components/ui/avatar";
import { CheckCircle, Clock, LinkIcon, ExternalLink, Loader2, User, Building, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { DataTable } from "../../../components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from 'next/link';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { ApplicationAssetBindingDialog } from "../../../components/admin/application-asset-binding-dialog";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Application {
  id: string;
  organization_name: string;
  business_id?: string; // Business ID if it's for an existing business
  business_name: string;
  facebook_business_manager_id?: string;
  facebook_business_manager_name?: string;
  account_count: number; // Number of accounts applied for
  timezone: string;
  status: 'In Review' | 'Processing' | 'Ready' | 'Active' | 'Rejected';
  team_name?: string;
  submitted_at: string;
  user_email: string;
  type?: 'Business' | 'Ad Account'; // Will be determined by business_id presence
}

const statusConfig = {
  "In Review": { label: "In Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  "Processing": { label: "Processing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Clock },
  "Ready": { label: "Ready", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  "Active": { label: "Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
  "Rejected": { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: CheckCircle },
};

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ applicationId: string; action: 'approve' | 'ready' } | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isBindingDialogOpen, setBindingDialogOpen] = useState(false);

  // Use SWR for data fetching with caching
  const { data: applications = [], error, isLoading, mutate } = useSWR<Application[]>(
    '/api/admin/applications',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds deduping
    }
  );

  const handleAction = async (applicationId: string, action: 'approve' | 'ready' | 'bind') => {
    toast.info(`Processing ${action} action...`);
    try {
      const response = await fetch(`/api/admin/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
      
      const result = await response.json();
      toast.success(result.message || `Application updated to ${result.new_status}`);
      await mutate(); // Re-fetch data to update UI

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`Error during ${action}:`, errorMessage);
      toast.error(`Failed to perform ${action}: ${errorMessage}`);
    }
  };
  
  const triggerConfirmation = (applicationId: string, action: 'approve' | 'ready') => {
    setPendingAction({ applicationId, action });
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      handleAction(pendingAction.applicationId, pendingAction.action);
    }
    setDialogOpen(false);
    setPendingAction(null);
  };

  const handleFulfillSuccess = () => {
    mutate(); // Refresh applications list
  };

  const handleFulfillClick = (app: Application) => {
    setSelectedApplication(app);
    setBindingDialogOpen(true);
  };

  const filteredApplications = useMemo(() => {
    if (!Array.isArray(applications)) return [];
    if (statusFilter === "all") return applications;
    const normalizedFilter = statusFilter.replace(/\s+/g, '');
    return applications.filter(app => 
      app.status.replace(/\s+/g, '').toLowerCase() === normalizedFilter.toLowerCase()
    );
  }, [applications, statusFilter]);

  const stats = useMemo(() => {
    if (!Array.isArray(applications)) {
      return { all: 0, inReview: 0, processing: 0, ready: 0 };
    }
    return {
      all: applications.length,
      inReview: applications.filter(a => a.status === "In Review").length,
      processing: applications.filter(a => a.status === "Processing").length,
      ready: applications.filter(a => a.status === "Ready").length,
    };
  }, [applications]);

  const columns: ColumnDef<Application>[] = useMemo(() => [
    {
      accessorKey: "organization_name",
      header: "Organization",
      size: 200,
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback>{app.organization_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{app.organization_name}</div>
              <div className="text-xs text-muted-foreground truncate">{app.user_email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "business_id",
      header: "Business ID",
      size: 120,
      cell: ({ row }) => {
        const app = row.original;
        return (
          <div className="text-sm">
            {app.business_id ? (
              <div>
                <div className="font-mono text-xs text-gray-600">{app.business_id}</div>
                <div className="text-xs text-gray-500">{app.business_name}</div>
              </div>
            ) : (
              <div className="text-gray-400 italic text-xs">New Business</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 120,
      cell: ({ row }) => {
        const app = row.original;
        // Determine type based on whether business_id exists
        const isNewBusiness = !app.business_id;
        return (
          <Badge variant="outline" className="text-xs">
            {isNewBusiness ? <Building className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
            {isNewBusiness ? 'New Business' : 'Additional Accounts'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "account_count",
      header: "Accounts",
      size: 80,
      cell: ({ row }) => (
        <div className="text-sm text-center font-medium">
          {row.original.account_count}
        </div>
      )
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      size: 120,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.timezone || 'UTC'}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["In Review"];
        return (
          <Badge className={`text-xs ${config.color}`}>
            <config.icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "team_name",
      header: "Team",
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <Users className="h-4 w-4" />
           <span className="truncate">{row.original.team_name || "Unassigned"}</span>
        </div>
      )
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      size: 120,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.submitted_at), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 140,
      cell: ({ row }) => {
        const app = row.original;
        if (app.status === 'In Review') {
          return <Button size="sm" className="h-7 text-xs" onClick={() => triggerConfirmation(app.id, 'approve')}>Approve</Button>;
        }
        if (app.status === 'Processing') {
          return <Button size="sm" className="h-7 text-xs" onClick={() => triggerConfirmation(app.id, 'ready')}>Mark as Ready</Button>;
        }
        if (app.status === 'Ready') {
          return <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleFulfillClick(app)}>Fulfill Request</Button>;
        }
        return null;
      },
    },
  ], [applications, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will update the application status. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="h-full flex flex-col space-y-4 p-4">
        <header>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-gray-600 mt-1">
            Fulfill client applications by assigning available Dolphin assets
          </p>
        </header>

        <div className="flex-grow flex flex-col">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
              <TabsTrigger value="In Review">In Review ({stats.inReview})</TabsTrigger>
              <TabsTrigger value="Processing">Processing ({stats.processing})</TabsTrigger>
              <TabsTrigger value="Ready">Ready ({stats.ready})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex-grow rounded-lg border">
              <DataTable columns={columns} data={filteredApplications} />
          </div>
        </div>
      </div>

      {selectedApplication && (
        <ApplicationAssetBindingDialog
          open={isBindingDialogOpen}
          onOpenChange={setBindingDialogOpen}
          application={selectedApplication}
          onSuccess={() => {
            mutate(); // Re-fetch applications
            setBindingDialogOpen(false);
          }}
        />
      )}
    </>
  );
} 