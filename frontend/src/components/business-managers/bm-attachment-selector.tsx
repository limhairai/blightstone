'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type BmAttachmentType = 'own' | 'request'

export interface BmAttachmentData {
  type: BmAttachmentType
  bmId: string
  bmName: string
  justification: string
}

interface BmAttachmentSelectorProps {
  selectedData: BmAttachmentData
  onDataChange: (data: BmAttachmentData) => void
  className?: string
}

export function BmAttachmentSelector({ 
  selectedData, 
  onDataChange, 
  className 
}: BmAttachmentSelectorProps) {
  const updateData = (updates: Partial<BmAttachmentData>) => {
    onDataChange({ ...selectedData, ...updates })
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Label className="text-foreground font-medium">
          Business Manager
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                Post-pay accounts don't come with a Business Manager. You can attach your own 
                existing BM or request our team to create one for you.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup 
        value={selectedData.type} 
        onValueChange={(value) => updateData({ type: value as BmAttachmentType })}
        className="space-y-4"
      >
        {/* Attach Own BM */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="own" id="own" className="mt-4" />
          <Label htmlFor="own" className="flex-1 cursor-pointer">
            <Card className={`p-4 transition-colors ${
              selectedData.type === 'own' 
                ? 'border-[#b4a0ff] bg-[#b4a0ff]/5' 
                : 'border-border hover:border-border/60'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20">
                  <Building2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">Attach My Business Manager</h3>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use your existing Business Manager for the post-pay accounts
                  </p>
                  
                  {selectedData.type === 'own' && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bmId" className="text-xs text-muted-foreground">
                          Business Manager ID
                        </Label>
                        <Input
                          id="bmId"
                          placeholder="e.g., 123456789012345"
                          value={selectedData.bmId || ''}
                          onChange={(e) => updateData({ bmId: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bmName" className="text-xs text-muted-foreground">
                          Business Manager Name
                        </Label>
                        <Input
                          id="bmName"
                          placeholder="e.g., My Company BM"
                          value={selectedData.bmName || ''}
                          onChange={(e) => updateData({ bmName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Label>
        </div>

        {/* Request New BM */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="request" id="request" className="mt-4" />
          <Label htmlFor="request" className="flex-1 cursor-pointer">
            <Card className={`p-4 transition-colors ${
              selectedData.type === 'request' 
                ? 'border-[#b4a0ff] bg-[#b4a0ff]/5' 
                : 'border-border hover:border-border/60'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Plus className="h-5 w-5 text-[#b4a0ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">Request New Business Manager</h3>
                    <Badge variant="outline" className="text-xs">White Glove</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our team will create and manage a new Business Manager for you
                  </p>
                  
                  {selectedData.type === 'request' && (
                    <div>
                      <Label htmlFor="justification" className="text-xs text-muted-foreground">
                        Business Justification (Optional)
                      </Label>
                      <Input
                        id="justification"
                        placeholder="e.g., Need separate BM for new product line..."
                        value={selectedData.justification || ''}
                        onChange={(e) => updateData({ justification: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Label>
        </div>
      </RadioGroup>

      {/* Additional info based on selection */}
      {selectedData.type === 'own' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
          <p className="text-sm text-foreground">
            <strong>Attach existing BM:</strong> You'll need to provide admin access to our team 
            for account setup and management. We'll guide you through the process.
          </p>
        </div>
      )}

      {selectedData.type === 'request' && (
        <div className="mt-4 p-3 bg-muted rounded-lg border border-[#b4a0ff]/20">
          <p className="text-sm text-foreground">
            <strong>New BM creation:</strong> Our white glove team will handle the entire setup process, 
            including Business Manager creation, verification, and initial configuration.
          </p>
        </div>
      )}
    </div>
  )
}