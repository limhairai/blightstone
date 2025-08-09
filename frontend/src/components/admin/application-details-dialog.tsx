"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { 
  Building2, 
  Globe, 
  Calendar,
  User,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ApplicationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}

export function ApplicationDetailsDialog({
  isOpen,
  onClose,
  application,
}: ApplicationDetailsDialogProps) {
  if (!application) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending Review", variant: "secondary" as const, icon: Clock, color: "text-muted-foreground" },
      under_review: { label: "Under Review", variant: "default" as const, icon: AlertTriangle, color: "text-muted-foreground" },
      active: { label: "Approved", variant: "default" as const, icon: CheckCircle, color: "text-[#34D197]" },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle, color: "text-muted-foreground" },
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
            Application Details: {application.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                <div className="mt-2">
                  {getStatusBadge(application.status)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Application ID</Label>
                <p className="text-foreground font-mono text-sm mt-1">{application.id}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {application.dateCreated ? 
                      format(new Date(application.dateCreated), "PPP 'at' p") :
                      "Unknown"
                    }
                  </span>
                </div>
              </div>

              {application.reviewedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Reviewed</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {format(new Date(application.reviewedAt), "PPP 'at' p")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                <p className="text-foreground font-semibold text-lg mt-1">{application.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                <p className="text-foreground capitalize mt-1">
                  {application.industry || "Not specified"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                {application.website ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={application.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline flex items-center gap-1"
                    >
                      {application.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">No website provided</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Description */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Business Description</Label>
            <div className="mt-2 p-4 bg-muted/50 rounded-lg border">
              <p className="text-foreground">
                {application.description || "No description provided"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Review History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review History
            </h3>

            <div className="space-y-3">
              {/* Application Submitted */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-border rounded-lg">
                <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Application Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {application.dateCreated ? 
                      formatDistanceToNow(new Date(application.dateCreated), { addSuffix: true }) :
                      "Unknown time"
                    }
                  </p>
                </div>
              </div>



              {/* Rejection Reason */}
              {application.rejectionReason && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-border rounded-lg">
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Application Rejected</p>
                    <p className="text-sm text-foreground mt-1">{application.rejectionReason}</p>
                    {application.reviewedAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(application.reviewedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Approval */}
              {application.status === "active" && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-border rounded-lg">
                  <div className="h-8 w-8 bg-[#34D197] rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Application Approved</p>
                    <p className="text-sm text-muted-foreground">
                      Business account activated and ready for ad account creation
                    </p>
                    {application.reviewedAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(application.reviewedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Business ID</Label>
                <p className="text-foreground font-mono text-sm mt-1">
                  {application.businessId || "Not assigned"}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Verification Status</Label>
                <p className="text-foreground mt-1 capitalize">
                  {application.verification || "Pending"}
                </p>
              </div>

              {application.timezone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Timezone</Label>
                  <p className="text-foreground mt-1">{application.timezone}</p>
                </div>
              )}

              {application.country && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                  <p className="text-foreground mt-1">{application.country}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Dialog Actions */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 