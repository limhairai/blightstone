"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, Building2, Users, FileText } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  organization_name?: string;
  business_name?: string;
  account_name?: string;
}

interface ApplicationApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSuccess: (applicationId: string) => Promise<void>;
}

export function ApplicationApprovalDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      
      // Call the real API to approve the application
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
                  body: JSON.stringify({
            application_id: application.id,
            action: 'approved'
          }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to approve application');
      }

      await onSuccess(application.id);
      toast.success("Application approved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#34D197]" />
            Approve Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-[#34D197] dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">Application Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{application.organization_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business:</span>
                <span className="font-medium">{application.business_name}</span>
              </div>
                             <div className="flex justify-between">
                 <span className="text-muted-foreground">Ad Account Name:</span>
                 <span className="font-medium">{application.account_name}</span>
               </div>
            </div>
          </div>

          <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Next Steps</span>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>After approval, this application will be:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Submitted to BlueFocus for processing</li>
                <li>Moved to &quot;At BlueFocus&quot; status</li>
                <li>Available for team assignment once ready</li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Are you sure you want to approve this application?
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={isSubmitting}
            className="bg-[#34D197] hover:bg-[#2BB87A]"
          >
            {isSubmitting ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 