"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Building2, 
  Globe, 
  Calendar,
  User,
  FileText,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApplicationReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string, reason: string) => void;
  onRequestMoreInfo: (applicationId: string, message: string) => void;
}

export function ApplicationReviewDialog({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
  onRequestMoreInfo,
}: ApplicationReviewDialogProps) {
  const [activeTab, setActiveTab] = useState<"approve" | "reject" | "more-info">("approve");

  const [rejectionReason, setRejectionReason] = useState("");
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      switch (activeTab) {
        case "approve":
          await onApprove(application.id);
          break;
        case "reject":
          if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
          }
          await onReject(application.id, rejectionReason);
          break;
        case "more-info":
          if (!moreInfoMessage.trim()) {
            alert("Please provide a message for the client");
            return;
          }
          await onRequestMoreInfo(application.id, moreInfoMessage);
          break;
      }
      
      // Reset form
  
      setRejectionReason("");
      setMoreInfoMessage("");
      onClose();
    } catch (error) {
      console.error("Error processing application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionButton = () => {
    const config = {
      approve: {
        label: "Approve Application",
        icon: CheckCircle,
        className: "bg-[#34D197] hover:bg-[#2BB87A] text-white",
      },
      reject: {
        label: "Reject Application",
        icon: XCircle,
        className: "bg-muted hover:bg-muted text-white",
      },
      "more-info": {
        label: "Request More Information",
        icon: MessageSquare,
        className: "bg-muted hover:bg-muted text-white",
      },
    };

    const { label, icon: Icon, className } = config[activeTab];

    return (
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={className}
      >
        <Icon className="h-4 w-4 mr-2" />
        {isSubmitting ? "Processing..." : label}
      </Button>
    );
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
            Review Application: {application.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Details
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                    <p className="text-foreground font-medium">{application.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                    <p className="text-foreground capitalize">{application.industry || "Not specified"}</p>
                  </div>
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
                    <p className="text-muted-foreground">No website provided</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-foreground mt-1">
                    {application.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={application.status === "pending" ? "secondary" : "default"}>
                        {application.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {application.dateCreated ? 
                          formatDistanceToNow(new Date(application.dateCreated), { addSuffix: true }) :
                          "Unknown"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-border rounded-lg">
                  <span className="text-sm font-medium">Website Verification</span>
                  <Badge variant="default" className="bg-[#34D197]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 border border-border rounded-lg">
                  <span className="text-sm font-medium">Industry Compliance</span>
                  <Badge variant="default" className="bg-[#34D197]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compliant
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-border rounded-lg">
                  <span className="text-sm font-medium">Documentation</span>
                  <Badge variant="secondary" className="bg-muted text-white">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Review Required
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Review Actions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Actions</h3>
              
              {/* Action Tabs */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-4">
                <button
                  onClick={() => setActiveTab("approve")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "approve"
                      ? "bg-[#34D197] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2 inline" />
                  Approve
                </button>
                <button
                  onClick={() => setActiveTab("reject")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "reject"
                      ? "bg-muted text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2 inline" />
                  Reject
                </button>
                <button
                  onClick={() => setActiveTab("more-info")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "more-info"
                      ? "bg-muted text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2 inline" />
                  More Info
                </button>
              </div>

              {/* Action Content */}
              <div className="space-y-4">
                {activeTab === "approve" && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Approving this application will start the account provisioning process. The business will be notified once their ad accounts are ready.
                    </p>
                  </div>
                )}

                {activeTab === "reject" && (
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Please provide a clear reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="mt-2"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      The client will receive this message explaining why their application was rejected.
                    </p>
                  </div>
                )}

                {activeTab === "more-info" && (
                  <div>
                    <Label htmlFor="more-info-message">Message to Client *</Label>
                    <Textarea
                      id="more-info-message"
                      placeholder="What additional information do you need from the client?"
                      value={moreInfoMessage}
                      onChange={(e) => setMoreInfoMessage(e.target.value)}
                      rows={4}
                      className="mt-2"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      The application will be marked as &quot;Under Review&quot; and the client will be notified.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dialog Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {getActionButton()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 