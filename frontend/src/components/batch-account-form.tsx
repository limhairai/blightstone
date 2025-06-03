"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Settings, Globe, Facebook, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BatchAccountFormProps {
  formData: any
  onChange: (data: any) => void
}

export function BatchAccountForm({ formData, onChange }: BatchAccountFormProps) {
  const [localData, setLocalData] = useState({
    businessManagerId: formData.businessManagerId || "",
    timezone: formData.timezone || "",
    accounts:
      formData.accounts.length > 0
        ? formData.accounts
        : [
            {
              id: 1,
              name: "",
              landingPageUrl: "",
              facebookPageUrl: "",
            },
          ],
  })

  // Only update parent when form is submitted, not on every change
  const handleChange = (field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAccountChange = (id: number, field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((account: any) => (account.id === id ? { ...account, [field]: value } : account)),
    }))
  }

  const addAccount = () => {
    setLocalData((prev) => {
      const newId = Math.max(...prev.accounts.map((a: any) => a.id)) + 1
      const newData = {
        ...prev,
        accounts: [
          ...prev.accounts,
          {
            id: newId,
            name: "",
            landingPageUrl: "",
            facebookPageUrl: "",
          },
        ],
      }

      // Update parent after adding account
      onChange(newData)
      return newData
    })
  }

  const removeAccount = (id: number) => {
    if (localData.accounts.length > 1) {
      setLocalData((prev) => {
        const newData = {
          ...prev,
          accounts: prev.accounts.filter((account: any) => account.id !== id),
        }

        // Update parent after removing account
        onChange(newData)
        return newData
      })
    }
  }

  // Submit changes to parent component
  const submitChanges = () => {
    onChange(localData)
  }

  // Update local state if parent props change significantly
  useEffect(() => {
    const shouldUpdate =
      formData.businessManagerId !== localData.businessManagerId ||
      formData.timezone !== localData.timezone ||
      formData.accounts.length !== localData.accounts.length;

    if (shouldUpdate) {
      setLocalData({
        businessManagerId: formData.businessManagerId || "",
        timezone: formData.timezone || "",
        accounts:
          formData.accounts.length > 0
            ? formData.accounts
            : [
                {
                  id: 1,
                  name: "",
                  landingPageUrl: "",
                  facebookPageUrl: "",
                },
              ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]); // localData.* fields are intentionally omitted from deps. This effect syncs formData prop to localData.
                 // Reading localData here is for comparison to prevent unnecessary updates or overwriting local state
                 // if formData re-renders but its relevant parts haven't changed. Adding localData fields would cause an infinite loop.

  // Submit changes when form loses focus
  const handleBlur = () => {
    submitChanges()
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="business-manager-id" className="text-[#999] flex items-center text-xs">
              <Settings className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
              Business Manager ID
            </Label>
            <Input
              id="business-manager-id"
              placeholder="Enter your Facebook Business Manager ID"
              value={localData.businessManagerId}
              onChange={(e) => handleChange("businessManagerId", e.target.value)}
              onBlur={handleBlur}
              className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-[#999] text-xs">
              Timezone
            </Label>
            <Select
              value={localData.timezone}
              onValueChange={(value) => {
                handleChange("timezone", value)
                submitChanges()
              }}
            >
              <SelectTrigger
                id="timezone"
                className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
              >
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#333]">
                <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                <SelectItem value="cet">CET (Central European Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 mb-2">
        <h3 className="text-sm text-[#b4a0ff]">Account Details</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#0a0a0a] border-[#333] text-[#b4a0ff] text-xs h-5 px-2">
            {localData.accounts.length} {localData.accounts.length === 1 ? "Account" : "Accounts"}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAccount}
            className="bg-[#0a0a0a] border-[#333] hover:bg-[#222] hover:border-[#444] text-[#b4a0ff] h-7 text-xs px-2"
          >
            <Plus className="mr-1 h-3 w-3" /> Add Account
          </Button>
        </div>
      </div>

      {localData.accounts.map((account: any, index: number) => (
        <div key={account.id} className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium">Account #{index + 1}</h4>
            {localData.accounts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAccount(account.id)}
                className="h-6 w-6 p-0 text-[#ff8080] hover:bg-[#ff8080]/10 hover:text-[#ff8080]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`account-name-${account.id}`} className="text-[#999] text-xs">
                Account Name
              </Label>
              <Input
                id={`account-name-${account.id}`}
                placeholder="Enter a name for this ad account"
                value={account.name}
                onChange={(e) => handleAccountChange(account.id, "name", e.target.value)}
                onBlur={handleBlur}
                className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`landing-page-url-${account.id}`} className="text-[#999] flex items-center text-xs">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
                Landing Page URL
              </Label>
              <Input
                id={`landing-page-url-${account.id}`}
                placeholder="https://example.com"
                value={account.landingPageUrl}
                onChange={(e) => handleAccountChange(account.id, "landingPageUrl", e.target.value)}
                onBlur={handleBlur}
                className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="space-y-1.5">
              <Label htmlFor={`facebook-page-url-${account.id}`} className="text-[#999] flex items-center text-xs">
                <Facebook className="h-3.5 w-3.5 mr-1.5 text-[#b4a0ff]" />
                Facebook Page URL
              </Label>
              <Input
                id={`facebook-page-url-${account.id}`}
                placeholder="https://facebook.com/yourpage"
                value={account.facebookPageUrl}
                onChange={(e) => handleAccountChange(account.id, "facebookPageUrl", e.target.value)}
                onBlur={handleBlur}
                className="bg-[#0a0a0a] border-[#333] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20 h-10 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
