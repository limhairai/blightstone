"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"

export function MultiAccountForm({ formData, onChange, isSubmitting, onSubmit }) {
  const [localData, setLocalData] = useState(formData)
  const [quantity, setQuantity] = useState(formData.accounts.length || 1)

  useEffect(() => {
    // Sync localData with parent formData
    setLocalData(formData)
    setQuantity(formData.accounts.length || 1)
  }, [formData])

  // Update quantity and accounts array
  const handleQuantityChange = (newQty) => {
    if (newQty < 1) return
    setQuantity(newQty)
    let accounts = [...localData.accounts]
    if (newQty > accounts.length) {
      for (let i = accounts.length; i < newQty; i++) {
        accounts.push({ id: i + 1, name: "", landingPageUrl: "", facebookPageUrl: "" })
      }
    } else if (newQty < accounts.length) {
      accounts = accounts.slice(0, newQty)
    }
    const newData = { ...localData, accounts }
    setLocalData(newData)
    onChange(newData)
  }

  // Shared field change
  const handleChange = (field, value) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  // Per-account field change
  const handleAccountChange = (idx, field, value) => {
    const accounts = localData.accounts.map((acc, i) =>
      i === idx ? { ...acc, [field]: value } : acc
    )
    const newData = { ...localData, accounts }
    setLocalData(newData)
    onChange(newData)
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-8"
    >
      {/* Card details header */}
      <h2 className="text-2xl font-bold mb-2">Card details</h2>

      {/* Shared fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label htmlFor="business-manager-id" className="text-[#999] text-xs">Card name *</Label>
          <Input
            id="business-manager-id"
            placeholder="Virtual card"
            value={localData.accounts[0]?.name || ""}
            onChange={e => handleAccountChange(0, "name", e.target.value)}
            className="bg-white text-black border-[#e5e5e5] h-12 text-base"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity" className="text-[#999] text-xs">No. of cards *</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-12 w-12 p-0" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}> <Minus /> </Button>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={e => handleQuantityChange(Number(e.target.value))}
              className="w-20 text-center bg-white text-black border-[#e5e5e5] h-12 text-base"
              required
            />
            <Button type="button" variant="outline" className="h-12 w-12 p-0" onClick={() => handleQuantityChange(quantity + 1)}> <Plus /> </Button>
          </div>
        </div>
      </div>

      {/* Virtual account and group (mocked for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label htmlFor="virtual-account" className="text-[#999] text-xs">Virtual account *</Label>
          <Select value={localData.virtualAccount || "primary"} onValueChange={val => handleChange("virtualAccount", val)} required>
            <SelectTrigger className="bg-white text-black border-[#e5e5e5] h-12 text-base">
              <SelectValue placeholder="Primary account" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border-[#e5e5e5]">
              <SelectItem value="primary">Primary account</SelectItem>
              <SelectItem value="secondary">Secondary account</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-[#888] cursor-pointer ml-2">+ New virtual account</span>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-group" className="text-[#999] text-xs">Card group *</Label>
          <Select value={localData.cardGroup || ""} onValueChange={val => handleChange("cardGroup", val)} required>
            <SelectTrigger className="bg-white text-black border-[#e5e5e5] h-12 text-base">
              <SelectValue placeholder="Select card group" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black border-[#e5e5e5]">
              <SelectItem value="group1">Group 1</SelectItem>
              <SelectItem value="group2">Group 2</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-[#888] cursor-pointer ml-2">+ New card group</span>
        </div>
      </div>

      {/* Account chips preview */}
      <div className="flex flex-wrap gap-2 mt-4">
        {localData.accounts.map((acc, idx) => (
          <Badge key={acc.id} className="bg-[#f3f3f3] text-[#444] px-4 py-2 rounded-full text-base font-medium">
            {quantity === 1 ? "VIRTUAL CARD" : `VIRTUAL CARD ${idx + 1}`}
          </Badge>
        ))}
      </div>

      {/* Submit button */}
      <div className="mt-8 flex justify-end">
        <Button type="submit" className="bg-[#e5e5e5] text-black px-6 py-3 rounded-full text-base font-semibold" disabled={isSubmitting}>
          {quantity === 1 ? "VIRTUAL CARD" : `VIRTUAL CARD${quantity > 1 ? `S` : ""}`}
        </Button>
      </div>
    </form>
  )
} 