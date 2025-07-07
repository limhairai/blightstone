"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import { Separator } from "../ui/separator";
import { 
  CreditCard, 
  Building2, 
  DollarSign,
  Settings,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface CreateAccountDialogProps {
  isOpen?: boolean;
  onClose: () => void;
  business?: any;
  trigger?: React.ReactNode;
}

export function CreateAccountDialog({
  isOpen = false,
  onClose,
  business,
  trigger,
}: CreateAccountDialogProps) {
  const [formData, setFormData] = useState({
    accountName: "",
    platform: "Meta",
    spendLimit: "5000",
    initialBalance: "1000",
    timezone: business?.timezone || "America/New_York",
    currency: "USD",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountName.trim()) {
      alert("Please provide an account name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate account creation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate account ID
      const accountId = `act_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;

      // Create new account object
      const newAccount = {
        id: crypto.randomUUID(),
        name: formData.accountName,
        accountId: accountId,
        status: "active",
        balance: parseInt(formData.initialBalance),
        spent: 0,
        spendLimit: parseInt(formData.spendLimit),
        platform: formData.platform,
        dateCreated: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit", 
          year: "numeric"
        }),
        lastActivity: "Just created",
        businessId: business?.id
      };

      // Add to business (in a real app, this would be an API call)
      if (business) {
        // business.adAccounts.push(newAccount); // Disabled - using adAccountIds instead
      }

      setShowSuccess(true);

      // Reset form and close after success
      setTimeout(() => {
        setFormData({
          accountName: "",
          platform: "Meta",
          spendLimit: "5000",
          initialBalance: "1000",
          timezone: business?.timezone || "America/New_York",
          currency: "USD",
        });
        setShowSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error creating account:", error);
      alert("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Account Created</h3>
            <p className="text-sm text-muted-foreground">
              The ad account has been successfully created and assigned to {business?.name}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#c4b5fd]" />
            Create Ad Account
          </DialogTitle>
        </DialogHeader>

        {business && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{business.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {business.businessType} • {business.adAccountIds?.length || 0} existing account{(business.adAccountIds?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Main Campaign Account"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meta">Meta (Facebook/Instagram)</SelectItem>
                    <SelectItem value="Google">Google Ads</SelectItem>
                    <SelectItem value="TikTok">TikTok Ads</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spendLimit">Daily Spend Limit ($)</Label>
                <Input
                  id="spendLimit"
                  type="number"
                  value={formData.spendLimit}
                  onChange={(e) => setFormData({ ...formData, spendLimit: e.target.value })}
                  placeholder="5000"
                  min="100"
                  max="50000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum daily spend allowed for this account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialBalance">Initial Balance ($)</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                  placeholder="1000"
                  min="0"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Starting balance for the account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />



          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Account Creation Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This will create a new ad account and assign it to the business. The account will be immediately active and ready for campaign creation.
                </p>
              </div>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 