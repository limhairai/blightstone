'use client'

import { useState } from 'react'
import { ChevronDown, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Offer } from '@/lib/stores/project-store'

interface InlineOfferDropdownProps {
  value?: string
  offers: Offer[]
  onChange: (offerId: string | null) => void
  disabled?: boolean
}

export function InlineOfferDropdown({
  value,
  offers,
  onChange,
  disabled = false
}: InlineOfferDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOffer = offers.find(offer => offer.id === value)

  const handleSelect = (offerId: string | null) => {
    onChange(offerId)
    setIsOpen(false)
  }

  if (disabled) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Package className="h-3 w-3" />
        {selectedOffer ? `${selectedOffer.name} (${selectedOffer.price})` : 'No offer'}
      </Badge>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 justify-start font-normal hover:bg-muted/50"
        >
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span className="text-xs">
              {selectedOffer ? `${selectedOffer.name} (${selectedOffer.price})` : 'Select offer'}
            </span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => handleSelect(null)}>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">No offer</span>
          </div>
        </DropdownMenuItem>
        {offers.map((offer) => (
          <DropdownMenuItem
            key={offer.id}
            onClick={() => handleSelect(offer.id)}
          >
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">{offer.name}</span>
                <span className="text-xs text-muted-foreground">{offer.price}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}