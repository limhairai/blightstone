"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { CreateAdAccountDialog } from "../../../components/accounts/create-ad-account-dialog";
import { 
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  FileText,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import useSWR from 'swr';
import { authenticatedFetcher } from "@/lib/swr-config";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

interface Application {
  id: string;
  account_name: string;
  website_url: string;
  spend_limit: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  businesses?: {
    id: string;
    name: string;
  };
  notes?: string;
  rejection_reason?: string;
}

export default function ApplicationsPage() {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Use SWR for applications data
  const { data: applicationsData, error, isLoading, mutate } = useSWR(
    session?.access_token ? 'applications' : null,
    () => authenticatedFetcher('/api/applications', session!.access_token),
    {
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      revalidateOnFocus: true, // ✅ FIXED: Enable focus revalidation
      revalidateOnReconnect: true, // ✅ FIXED: Enable reconnect revalidation
      revalidateIfStale: true, // ✅ FIXED: Update stale data automatically
      keepPreviousData: true, // ✅ Smooth transitions
    }
  );

  const applications: Application[] = applicationsData?.applications || [];

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = !searchQuery || 
        app.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.website_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.businesses?.name && app.businesses.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        case "oldest":
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        case "name":
          return a.account_name.localeCompare(b.account_name);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "under_review":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><AlertTriangle className="h-3 w-3 mr-1" />Under Review</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      toast.success("Application approved successfully");
      mutate(); // Refresh data
    } catch (error) {
      toast.error("Failed to approve application");
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      toast.success("Application rejected");
      mutate(); // Refresh data
    } catch (error) {
      toast.error("Failed to reject application");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to load applications</h3>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => mutate()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </Button>
          </div>
        </div>

        <CreateAdAccountDialog
          trigger={
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          }
        />
      </div>

      {/* Compact Metrics */}
      <div className="flex items-center gap-8 text-sm">
        <div>
          <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
            Total Applications
          </span>
          <div className="text-foreground font-semibold">
            {applications.length}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
            Pending Review
          </span>
          <div className="text-foreground font-semibold">
            {applications.filter(a => ['pending', 'under_review'].includes(a.status)).length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "No applications have been submitted yet"}
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {application.account_name}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{application.businesses?.name || 'Unknown Business'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>${application.spend_limit.toLocaleString()} spend limit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={application.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {application.website_url}
                        </a>
                      </div>



                      {application.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {application.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 