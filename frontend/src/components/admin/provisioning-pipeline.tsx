"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from 'swr';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Building2,
  Calendar,
  Settings,
  Users,
  CreditCard,
  Globe,
  ArrowRight,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ProvisioningPipeline() {
  const { data: bizData, isLoading, mutate } = useSWR('/api/businesses', fetcher);
  const businesses = bizData?.businesses || [];

  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Filter businesses in provisioning states using proper admin statuses
  const provisioningBusinesses = businesses.filter(
    (business: any) => business.status === "provisioning" || business.status === "ready" || business.status === "under_review"
  );

  const getProvisioningStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: { label: "Not Started", variant: "secondary" as const, icon: Clock, color: "text-gray-600" },
      hk_provider_submitted: { label: "HK Provider Submitted", variant: "default" as const, icon: ExternalLink, color: "text-foreground" },
      hk_provider_approved: { label: "HK Provider Approved", variant: "default" as const, icon: CheckCircle, color: "text-[#34D197]" },
      bm_assigned: { label: "BM Assigned", variant: "default" as const, icon: Building2, color: "text-foreground" },
      account_created: { label: "Account Created", variant: "default" as const, icon: CreditCard, color: "text-indigo-600" },
      client_invited: { label: "Client Invited", variant: "default" as const, icon: Users, color: "text-muted-foreground" },
      completed: { label: "Completed", variant: "default" as const, icon: CheckCircle, color: "text-[#34D197]" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getNextAction = (provisioningStatus: string) => {
    const actions = {
      not_started: "Submit to HK Provider",
      hk_provider_submitted: "Check HK Provider Status",
      hk_provider_approved: "Assign Business Manager",
      bm_assigned: "Create Ad Account",
      account_created: "Invite Client",
      client_invited: "Complete Setup",
      completed: "Manage Account"
    };

    return actions[provisioningStatus as keyof typeof actions] || "Unknown";
  };

  const handleProvisioningAction = async (business: any, action: string) => {
    let updates: any = {};

    switch (action) {
      case "submit_hk_provider":
        updates = {
          provisioningStatus: "hk_provider_submitted",
          hkProviderApplicationId: `HK-${Date.now()}`,
          hkProviderStatus: "pending",
    
        };
        break;

      case "approve_hk_provider":
        updates = {
          provisioningStatus: "hk_provider_approved",
          hkProviderStatus: "approved",
    
        };
        break;

      case "assign_bm":
        updates = {
          provisioningStatus: "bm_assigned",
          assignedBmId: `BM-${Date.now()}`,
          assignedProfileSetId: `PS-${Date.now()}`,
    
        };
        break;

      case "create_account":
        updates = {
          provisioningStatus: "account_created",
          adAccountIds: [`AD-${Date.now()}`],
    
        };
        break;

      case "invite_client":
        updates = {
          provisioningStatus: "client_invited",
          clientInvitedAt: new Date().toISOString(),
    
        };
        break;

      case "complete_setup":
        updates = {
          provisioningStatus: "completed",
          status: "ready",
          provisioningCompletedAt: new Date().toISOString(),
          clientAccessGranted: true,
    
        };
        break;
    }

    try {
      const response = await fetch(`/api/businesses?id=${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error("Failed to update business");
      }
      // Ideally, we would mutate the SWR cache here
      // For now, this will rely on a parent component to refetch
    } catch (err) {
      console.error(err);
      // Handle error with a toast notification
    }

    setDialogOpen(false);
  };

  const openActionDialog = (business: any, action: string) => {
    setSelectedBusiness(business);
    setActionType(action);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading provisioning pipeline...</div>
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {provisioningBusinesses.filter((b: any) => b.status === "provisioning").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">HK Provider Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {provisioningBusinesses.filter((b: any) => b.status === "under_review").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {provisioningBusinesses.filter((b: any) => b.status === "ready").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#34D197]">
              {businesses.filter((b: any) => b.status === "approved" || b.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provisioning Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Provisioning Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>HK Provider</TableHead>
                <TableHead>BM Assignment</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Next Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {provisioningBusinesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No businesses in provisioning pipeline
                  </TableCell>
                </TableRow>
              ) : (
                provisioningBusinesses.map((business: any) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{business.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {business.type || "Business"} • Created {formatDistanceToNow(new Date(business.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getProvisioningStatusBadge("not_started")}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Not submitted</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: "10%" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">10%</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => openActionDialog(business, 'submit_hk_provider')}
                        disabled={actionLoading}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      {selectedBusiness && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action: {actionType.replace(/_/g, ' ')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to perform this action for <strong>{selectedBusiness.name}</strong>?</p>
              {/* Add more details here based on actionType if needed */}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={() => handleProvisioningAction(selectedBusiness, actionType)} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 