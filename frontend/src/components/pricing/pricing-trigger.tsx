'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PlanUpgradeDialog } from './plan-upgrade-dialog'

interface PricingTriggerProps {
  children: React.ReactNode
  mode?: 'dialog' | 'page' // Choose between dialog or page
  className?: string
  currentPlan?: { id: string }
}

export function PricingTrigger({ 
  children, 
  mode = 'dialog', 
  className,
  currentPlan 
}: PricingTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (mode === 'page') {
      router.push('/pricing')
    } else {
      setDialogOpen(true)
    }
  }

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      
      {mode === 'dialog' && (
        <PlanUpgradeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          redirectToPage={false}
        />
      )}
    </>
  )
}

// Helper component for common button usage
export function PricingButton({ 
  mode = 'dialog' as const, 
  currentPlan,
  className = "w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0",
  size = "default" as any,
  ...props 
}: {
  mode?: 'dialog' | 'page'
  currentPlan?: { id: string }
  className?: string
  size?: any
  [key: string]: any
}) {
  return (
    <PricingTrigger mode={mode} currentPlan={currentPlan}>
      <Button className={className} size={size} {...props}>
        {currentPlan?.id === 'free' ? 'Choose Plan' : 'Upgrade Plan'}
      </Button>
    </PricingTrigger>
  )
} 