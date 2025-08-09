'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Wallet, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type AccountType = 'postpay' | 'prepay'

interface AccountTypeSelectorProps {
  selectedType: AccountType
  onTypeChange: (type: AccountType) => void
  className?: string
}

export function AccountTypeSelector({ 
  selectedType, 
  onTypeChange, 
  className 
}: AccountTypeSelectorProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Label className="text-foreground font-medium">
          Account Type
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                Post-pay accounts use credit lines and are billed after ad spend. 
                Prepay accounts require upfront funding through our BlueFocus provider.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup 
        value={selectedType} 
        onValueChange={(value) => onTypeChange(value as AccountType)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Post-pay Credit Accounts */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="postpay" id="postpay" />
          <Label htmlFor="postpay" className="flex-1 cursor-pointer">
            <Card className={`p-4 transition-colors ${
              selectedType === 'postpay' 
                ? 'border-[#b4a0ff] bg-[#b4a0ff]/5' 
                : 'border-border hover:border-border/60'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="h-5 w-5 text-[#b4a0ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">Post-pay Credit</h3>
                    <Badge variant="secondary" className="text-xs">Premium</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Credit line accounts with post-billing
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• No upfront funding required</li>
                    <li>• Billed after ad spend</li>
                    <li>• Higher spending limits</li>
                    <li>• White glove account management</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Label>
        </div>

        {/* Prepay BlueFocus Accounts */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="prepay" id="prepay" />
          <Label htmlFor="prepay" className="flex-1 cursor-pointer">
            <Card className={`p-4 transition-colors ${
              selectedType === 'prepay' 
                ? 'border-[#b4a0ff] bg-[#b4a0ff]/5' 
                : 'border-border hover:border-border/60'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-green-500/20">
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">Prepay BlueFocus</h3>
                    <Badge variant="outline" className="text-xs">Standard</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Traditional prepaid ad accounts
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Requires upfront funding</li>
                    <li>• Immediate account access</li>
                    <li>• Standard spending limits</li>
                    <li>• Comes with Business Manager</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Label>
        </div>
      </RadioGroup>

      {/* Additional info based on selection */}
      {selectedType === 'postpay' && (
        <div className="mt-4 p-3 bg-muted rounded-lg border border-[#b4a0ff]/20">
          <p className="text-sm text-foreground">
            <strong>Post-pay accounts:</strong> You'll need to provide your own Business Manager or request one. 
            Our team will handle the credit line setup and account management.
          </p>
        </div>
      )}

      {selectedType === 'prepay' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
          <p className="text-sm text-foreground">
            <strong>Prepay accounts:</strong> These come with a BlueFocus Business Manager and require 
            upfront funding before ad spend. Standard processing applies.
          </p>
        </div>
      )}
    </div>
  )
}