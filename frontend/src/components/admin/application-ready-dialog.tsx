"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Clock, Building2, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  organization_name?: string;
  business_name?: string;
}

interface ApplicationReadyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onMarkReady: (applicationId: string) => Promise<void>;
}

export function ApplicationReadyDialog({
  open,
  onOpenChange,
  application,
  onMarkReady,
}: ApplicationReadyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkReady = async () => {
    try {
      setIsSubmitting(true);
      
      // Call the real API to mark application as ready
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: application.id,
          action: 'under_review'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to mark application as ready');
      }

      await onMarkReady(application.id);
      toast.success("Application marked as ready!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking application ready:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark application as ready");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Mark Application Ready
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Application Details</span>
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

            </div>
          </div>

          <div className="p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Next Steps</span>
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <p>After marking as ready, this application will be:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Moved to &quot;Needs Binding&quot; status</li>
                <li>Available for team assignment</li>
                <li>Ready for ad account binding</li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Confirm that BlueFocus has processed this application and it&apos;s ready for team assignment.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleMarkReady} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Ready
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 