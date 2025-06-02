"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, FileText, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type React from "react"

export function BatchApplicationForm() {
  const router = useRouter()
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: "",
      landingPageUrl: "",
      facebookPageUrl: "",
    },
  ])
  const [loading, setLoading] = useState(false)

  // Business Manager Details - SHARED ACROSS ALL ACCOUNTS
  const [businessManagerId, setBusinessManagerId] = useState("")
  const [timezone, setTimezone] = useState("")

  const addAccount = () => {
    const newId = accounts.length > 0 ? Math.max(...accounts.map((a) => a.id)) + 1 : 1
    setAccounts([
      ...accounts,
      {
        id: newId,
        name: "",
        landingPageUrl: "",
        facebookPageUrl: "",
      },
    ])
  }

  const removeAccount = (id: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((account) => account.id !== id))
    }
  }

  const updateAccount = (id: number, field: string, value: string) => {
    setAccounts(accounts.map((account) => (account.id === id ? { ...account, [field]: value } : account)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      router.push("/accounts")
    }, 1500)
  }

  return (
    <Card className="bg-[#141414] border-[#2C2C2E] shadow-lg overflow-hidden">
      <CardHeader className="border-b border-[#2C2C2E] bg-[#1C1C1E]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium">Batch Ad Account Application</CardTitle>
            <CardDescription className="text-[#A0A0A0]">
              Apply for multiple ad accounts at once with the same Business Manager
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-[#1C1C1E] border-[#b4a0ff] text-[#b4a0ff]">
            {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {/* Business Manager Details - SHARED ACROSS ALL ACCOUNTS */}
          <div className="bg-[#1A1A1A] border border-[#2C2C2E] rounded-lg p-4 space-y-4">
            <h3 className="text-md font-medium flex items-center">
              <Settings className="mr-2 h-4 w-4 text-[#b4a0ff]" />
              Business Manager Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-manager-id-shared" className="text-[#E0E0E0]">
                  Business Manager ID
                </Label>
                <Input
                  id="business-manager-id-shared"
                  placeholder="Enter your Facebook Business Manager ID"
                  className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                  value={businessManagerId}
                  onChange={(e) => setBusinessManagerId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone-shared" className="text-[#E0E0E0]">
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone} required>
                  <SelectTrigger
                    id="timezone-shared"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                  >
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1E] border-[#2C2C2E]">
                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                    <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                    <SelectItem value="cet">CET (Central European Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium flex items-center">
              <FileText className="mr-2 h-4 w-4 text-[#b4a0ff]" />
              Account Details
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAccount}
              className="bg-[#1A1A1A] border-[#2C2C2E] hover:bg-[#2C2C2E] text-[#b4a0ff]"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Account
            </Button>
          </div>

          {/* Individual Account Forms - ONLY NAME, LANDING PAGE URL, AND FACEBOOK PAGE URL */}
          {accounts.map((account, index) => (
            <div key={account.id} className="bg-[#1A1A1A] border border-[#2C2C2E] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Account #{index + 1}</h4>
                {accounts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccount(account.id)}
                    className="h-8 w-8 p-0 text-[#ff8080]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor={`account-name-${account.id}`} className="text-[#E0E0E0]">
                    Account Name
                  </Label>
                  <Input
                    id={`account-name-${account.id}`}
                    placeholder="Enter a name for this ad account"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    value={account.name}
                    onChange={(e) => updateAccount(account.id, "name", e.target.value)}
                    required
                  />
                </div>

                {/* Landing Page URL */}
                <div className="space-y-2">
                  <Label htmlFor={`landing-page-url-${account.id}`} className="text-[#E0E0E0]">
                    Landing Page URL
                  </Label>
                  <Input
                    id={`landing-page-url-${account.id}`}
                    placeholder="https://example.com"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    value={account.landingPageUrl}
                    onChange={(e) => updateAccount(account.id, "landingPageUrl", e.target.value)}
                    required
                  />
                </div>

                {/* Facebook Page URL */}
                <div className="space-y-2">
                  <Label htmlFor={`facebook-page-url-${account.id}`} className="text-[#E0E0E0]">
                    Facebook Page URL
                  </Label>
                  <Input
                    id={`facebook-page-url-${account.id}`}
                    placeholder="https://facebook.com/yourpage"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    value={account.facebookPageUrl}
                    onChange={(e) => updateAccount(account.id, "facebookPageUrl", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="border-t border-[#2C2C2E] pt-6 bg-[#1C1C1E]">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between">
            <Button type="button" variant="outline" className="bg-[#1A1A1A] border-[#2C2C2E] hover:bg-[#2C2C2E]">
              <Save className="mr-2 h-4 w-4" /> Save as Template
            </Button>

            <Button
              type="submit"
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
