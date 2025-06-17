"use client";

import { useState } from "react";
import { useDemoState } from "../../contexts/DemoStateContext";
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
  Globe
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ApplicationsReviewTable() {
  const { state, updateBusiness } = useDemoState();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filter applications based on search and status
  const filteredApplications = state.businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || business.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      under_review: { label: "Under Review", variant: "default" as const, icon: AlertTriangle, color: "text-orange-600" },
      active: { label: "Approved", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
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

  const handleReviewApplication = (application: any) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
  };

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleApproveApplication = async (applicationId: string, notes?: string) => {
    const application = state.businesses.find(b => b.id === applicationId);
    if (application) {
      await updateBusiness({
        ...application,
        status: "provisioning", // Changed from "active" to "provisioning"
        verification: "verified",
        reviewNotes: notes,
        reviewedAt: new Date().toISOString(),
        // Initialize provisioning workflow
        provisioningStatus: "not_started",
        provisioningStartedAt: new Date().toISOString(),
        provisioningNotes: "Application approved - starting provisioning pipeline",
      });
    }
    setReviewDialogOpen(false);
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    const application = state.businesses.find(b => b.id === applicationId);
    if (application) {
      await updateBusiness({
        ...application,
        status: "rejected",
        verification: "rejected",
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      });
    }
    setReviewDialogOpen(false);
  };

  const handleRequestMoreInfo = async (applicationId: string, message: string) => {
    const application = state.businesses.find(b => b.id === applicationId);
    if (application) {
      await updateBusiness({
        ...application,
        status: "under_review",
        reviewNotes: message,
        reviewedAt: new Date().toISOString(),
      });
    }
    setReviewDialogOpen(false);
  };

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
            <SelectItem value="active">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications found matching your criteria.
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
                        <div className="font-medium text-foreground">{application.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {application.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-foreground capitalize">
                      {application.industry || "Not specified"}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {application.website ? (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={application.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Site
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No website</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {application.dateCreated ? 
                        formatDistanceToNow(new Date(application.dateCreated), { addSuffix: true }) :
                        "Unknown"
                      }
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {(application.status === "pending" || application.status === "under_review") && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReviewApplication(application)}
                          className="h-8 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                        >
                          Review
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