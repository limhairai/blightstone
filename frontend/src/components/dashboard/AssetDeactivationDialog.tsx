"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Power, PowerOff } from 'lucide-react';
import { useAssetDeactivation } from '@/hooks/useAssetDeactivation';

interface AssetDeactivationDialogProps {
  asset: {
    id: string;
    asset_id: string;
    name: string;
    type: 'business_manager' | 'ad_account';
    is_active: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AssetDeactivationDialog({ 
  asset, 
  open, 
  onOpenChange, 
  onSuccess 
}: AssetDeactivationDialogProps) {
  const { isLoading, toggleAssetActivation } = useAssetDeactivation({
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    }
  });

  const isBusinessManager = asset.type === 'business_manager';
  const isCurrentlyActive = asset.is_active;
  const action = isCurrentlyActive ? 'deactivate' : 'activate';
  const actionTitle = isCurrentlyActive ? 'Deactivate' : 'Activate';

  const handleConfirm = async () => {
    try {
      await toggleAssetActivation(asset.asset_id, !isCurrentlyActive);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCurrentlyActive ? (
              <PowerOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Power className="h-5 w-5 text-muted-foreground" />
            )}
            {actionTitle} {isBusinessManager ? 'Business Manager' : 'Ad Account'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium">{asset.name}</div>
            <div className="text-sm text-muted-foreground">
              {isBusinessManager ? 'Business Manager' : 'Ad Account'}
            </div>
          </div>

          {isCurrentlyActive ? (
            // Deactivation warning
            <div className="p-4 bg-muted border rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium">
                    {actionTitle} Asset
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isBusinessManager ? (
                      <>
                        Deactivating this business manager will:
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Temporarily pause its usage</li>
                          <li>Automatically deactivate all ad accounts in this BM</li>
                          <li>Prevent new ad account requests for this BM</li>
                          <li>Block wallet top-ups to associated ad accounts</li>
                          <li>Keep the asset visible in your dashboard</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        Deactivating this ad account will:
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Temporarily pause its usage</li>
                          <li>Block wallet top-ups to this account</li>
                          <li>Keep the account visible in your dashboard</li>
                        </ul>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    You can reactivate this asset at any time.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Activation info
            <div className="p-4 bg-muted border rounded-lg">
              <div className="flex items-start gap-2">
                <Power className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium">
                    {actionTitle} Asset
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isBusinessManager ? (
                      <>
                        Activating this business manager will:
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Resume its normal operation</li>
                          <li>Allow new ad account requests for this BM</li>
                          <li>Enable wallet top-ups to associated ad accounts</li>
                          <li>Make the asset fully functional</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">
                          Note: Ad accounts will remain deactivated and need to be activated individually.
                        </p>
                      </>
                    ) : (
                      <>
                        Activating this ad account will:
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>Resume its normal operation</li>
                          <li>Enable wallet top-ups to this account</li>
                          <li>Make the account fully functional</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="default"
            onClick={handleConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : actionTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 