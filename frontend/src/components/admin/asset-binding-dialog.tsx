"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { LinkIcon, Users, Shield, CheckCircle, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  plan: string;
  verification_status: string;
}

interface Business {
  id: string;
  name: string;
  status: string;
  organization_id: string;
}

interface AssetBindingDialogProps {
  open: boolean;
  onClose: () => void;
  onBound: (organizationId: string, businessId?: string) => Promise<void>;
  type: "business-manager" | "ad-account";
  name: string;
  id: string;
}

export function AssetBindingDialog({
  open,
  onClose,
  onBound,
  type,
  name,
  id,
}: AssetBindingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [spendLimit, setSpendLimit] = useState("5000");
  const [feePercentage, setFeePercentage] = useState("5");
  const [notes, setNotes] = useState("");
  
  // Data loading states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    };

    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  // Fetch businesses when organization is selected
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!selectedOrganization) {
        setBusinesses([]);
        return;
      }

      try {
        setLoadingBusinesses(true);
        const response = await fetch(`/api/businesses?organization_id=${selectedOrganization}`);
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        toast.error('Failed to load businesses');
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [selectedOrganization]);

  const handleBind = async () => {
    if (!selectedOrganization) {
      toast.error("Please select an organization");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const bindingData = {
        action: 'bind',
        dolphin_asset_id: id,
        organization_id: selectedOrganization,
        business_id: selectedBusiness || undefined,
        spend_limits: {
          monthly: parseFloat(spendLimit),
          total: parseFloat(spendLimit) * 12 // Assume yearly limit is 12x monthly
        },
        fee_percentage: parseFloat(feePercentage) / 100,
        notes: notes || undefined
      };

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bindingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to bind asset');
      }

      await onBound(selectedOrganization, selectedBusiness);
      onClose();
      
      // Reset form
      setSelectedOrganization("");
      setSelectedBusiness("");
      setSpendLimit("5000");
      setFeePercentage("5");
      setNotes("");
      
    } catch (error) {
      console.error("Error binding asset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to bind asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrgData = organizations.find(org => org.id === selectedOrganization);
  const selectedBusinessData = businesses.find(biz => biz.id === selectedBusiness);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-purple-600" />
            Bind {type === "business-manager" ? "Business Manager" : "Ad Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              {type === "business-manager" ? (
                <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              )}
              <span className="font-medium text-purple-800 dark:text-purple-200">Asset Details</span>
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <p><strong>Name:</strong> {name}</p>
              <p><strong>Type:</strong> {type === "business-manager" ? "Business Manager" : "Ad Account"}</p>
              <p><strong>Asset ID:</strong> {id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization-select">Select Organization *</Label>
              {loadingOrgs ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading organizations...</span>
                </div>
              ) : (
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-xs text-muted-foreground">Plan: {org.plan}</div>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {org.verification_status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedOrganization && (
              <div className="space-y-2">
                <Label htmlFor="business-select">Select Business (Optional)</Label>
                {loadingBusinesses ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading businesses...</span>
                  </div>
                ) : (
                  <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a business (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific business</SelectItem>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{business.name}</div>
                            </div>
                            <Badge variant="outline" className="text-xs ml-2">
                              {business.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spend-limit">Monthly Spend Limit ($)</Label>
                <Input
                  id="spend-limit"
                  type="number"
                  value={spendLimit}
                  onChange={(e) => setSpendLimit(e.target.value)}
                  placeholder="5000"
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-percentage">Fee Percentage (%)</Label>
                <Input
                  id="fee-percentage"
                  type="number"
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(e.target.value)}
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this binding..."
                rows={3}
              />
            </div>
          </div>

          {selectedOrganization && (
            <div className="p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">Binding Summary</span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                <p><strong>Organization:</strong> {selectedOrgData?.name}</p>
                {selectedBusinessData && (
                  <p><strong>Business:</strong> {selectedBusinessData.name}</p>
                )}
                <p><strong>Monthly Limit:</strong> ${spendLimit}</p>
                <p><strong>Fee:</strong> {feePercentage}%</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBind} 
            disabled={isSubmitting || !selectedOrganization}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Binding...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Bind Asset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 