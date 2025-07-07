"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ApplicationReviewDialog } from "./application-review-dialog";
import { ApplicationDetailsDialog } from "./application-details-dialog";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  ExternalLink,
  Building2,
  Calendar,
  Globe,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Application {
  id: string;
  user_id: string;
  organization_id: string;
  business_id: string;
  account_name: string;
  spend_limit: number;
  landing_page_url?: string;
  facebook_page_url?: string;
  campaign_description?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  assigned_account_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  businesses?: {
    name: string;
    organization_id: string;
  };
  organizations?: {
    name: string;
  };
  users?: {
    email: string;
    full_name: string;
  };
}

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function ApplicationsReviewTable() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch applications from API
  const fetchApplications = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/applications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [session, statusFilter]);

  // Filter applications based on search
  const filteredApplications = applications.filter((application) => {
    const matchesSearch = 
      application.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.businesses?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      under_review: { label: "Under Review", variant: "default" as const, icon: AlertTriangle, color: "text-orange-600" },
      approved: { label: "Approved", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleReviewApplication = (application: Application) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleApproveApplication = async (applicationId: string) => {
    if (!session) {
      return;
    }

    try {
      // Get current user ID from session directly
      const user = (session as any).user;
      
      if (!user?.id) {
        throw new Error('No authenticated user found in session');
      }
      
      const requestBody = {
        adminUserId: user.id,
      };

      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve application');
      }

      toast.success('Application approved successfully');
      setReviewDialogOpen(false);
      fetchApplications(); // Refresh list
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    if (!session) return;

    try {
      // Get current user ID from session directly
      const user = (session as any).user;
      if (!user?.id) {
        throw new Error('No authenticated user found in session');
      }

      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
        body: JSON.stringify({
          adminUserId: user.id,
          rejectionReason: reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject application');
      }

      toast.success('Application rejected');
      setReviewDialogOpen(false);
      fetchApplications(); // Refresh list
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject application');
    }
  };

  const handleRequestMoreInfo = async (applicationId: string, message: string) => {
    // This would require a separate endpoint for requesting more info
    // For now, we'll show a placeholder
    toast.info('Request more info feature coming soon');
    setReviewDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No applications found matching your search.' : 'No applications found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{application.account_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${application.spend_limit.toLocaleString()} spend limit
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {application.businesses?.name || 'Unknown Business'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.organizations?.name || 'Unknown Organization'}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {application.users?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.users?.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {application.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewApplication(application)}
                          className="h-8 px-3 text-blue-600 hover:text-blue-700"
                        >
                          Review
                        </Button>
                      )}
                      
                      {application.assigned_account_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          title="View assigned account"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      {selectedApplication && (
        <ApplicationReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          application={selectedApplication}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
          onRequestMoreInfo={handleRequestMoreInfo}
        />
      )}

      {/* Details Dialog */}
      {selectedApplication && (
        <ApplicationDetailsDialog
          isOpen={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          application={selectedApplication}
        />
      )}
    </div>
  );
} 