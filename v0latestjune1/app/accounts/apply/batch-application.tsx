"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, FileText, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type React from "react"

import { useToast } from "@/components/ui/use-toast"

interface AccountApplication {
  id: number
  name: string
  landingPageUrl: string
  facebookPageUrl: string
}

interface BusinessProfile {
  id: number
  name: string
  businessManagerId: string
  timezone: string
  industry: string
}

const TIMEZONES = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00",
  "UTC-09:00",
  "UTC-08:00",
  "UTC-07:00",
  "UTC-06:00",
  "UTC-05:00",
  "UTC-04:00",
  "UTC-03:00",
  "UTC-02:00",
  "UTC-01:00",
  "UTC+00:00",
  "UTC+01:00",
  "UTC+02:00",
  "UTC+03:00",
  "UTC+04:00",
  "UTC+05:00",
  "UTC+06:00",
  "UTC+07:00",
  "UTC+08:00",
  "UTC+09:00",
  "UTC+10:00",
  "UTC+11:00",
  "UTC+12:00",
]

const INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Finance",
  "Education",
  "Healthcare",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Fashion",
  "Beauty",
  "Technology",
  "Entertainment",
  "Gaming",
  "Sports",
  "Fitness",
  "Home & Garden",
  "Automotive",
  "Other",
]

export function BatchApplication() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("batch")
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: "",
      landingPageUrl: "",
      facebookPageUrl: "",
    },
    {
      id: 2,
      name: "",
      landingPageUrl: "",
      facebookPageUrl: "",
    },
  ])
  const [loading, setLoading] = useState(false)

  // Business Manager Details
  const [businessManagerId, setBusinessManagerId] = useState("")
  const [timezone, setTimezone] = useState("")
  const [industry, setIndustry] = useState("")

  // Saved Profiles
  const [profileName, setProfileName] = useState("")
  const [savedProfiles, setSavedProfiles] = useState<BusinessProfile[]>([
    {
      id: 1,
      name: "Main Business",
      businessManagerId: "123456789",
      timezone: "UTC+08:00",
      industry: "E-commerce",
    },
  ])
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null)

  const handleAddAccount = () => {
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

  const handleRemoveAccount = (id: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((account) => account.id !== id))
    } else {
      toast({
        title: "Cannot remove account",
        description: "You must have at least one account in your application.",
        variant: "destructive",
      })
    }
  }

  const handleAccountChange = (id: number, field: string, value: string) => {
    setAccounts(accounts.map((account) => (account.id === id ? { ...account, [field]: value } : account)))
  }

  const saveProfile = () => {
    if (!profileName || !businessManagerId) {
      toast({
        title: "Missing information",
        description: "Please provide a profile name and Business Manager ID.",
        variant: "destructive",
      })
      return
    }

    const newId = Math.max(0, ...savedProfiles.map((p) => p.id)) + 1
    const newProfile: BusinessProfile = {
      id: newId,
      name: profileName,
      businessManagerId,
      timezone,
      industry,
    }

    setSavedProfiles([...savedProfiles, newProfile])
    setProfileName("")

    toast({
      title: "Profile saved",
      description: "Your business profile has been saved for future use.",
    })
  }

  const selectProfile = (profile: BusinessProfile) => {
    setSelectedProfile(profile)
    setBusinessManagerId(profile.businessManagerId)
    setTimezone(profile.timezone)
    setIndustry(profile.industry)
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

  const addAccount = () => {
    handleAddAccount()
  }

  const removeAccount = (id: number) => {
    handleRemoveAccount(id)
  }

  const updateAccount = (id: number, field: string, value: string) => {
    handleAccountChange(id, field, value)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="batch">Batch Application</TabsTrigger>
          <TabsTrigger value="single">Single Application</TabsTrigger>
          <TabsTrigger value="profiles">Saved Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-6">
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
                      <Label htmlFor="business-manager-id" className="text-[#E0E0E0]">
                        Business Manager ID
                      </Label>
                      <Input
                        id="business-manager-id"
                        placeholder="Enter your Facebook Business Manager ID"
                        className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                        value={businessManagerId}
                        onChange={(e) => setBusinessManagerId(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-[#E0E0E0]">
                        Timezone
                      </Label>
                      <Select value={timezone} onValueChange={setTimezone} required>
                        <SelectTrigger className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-[#2C2C2E]">
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
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
                          value={account.landingPageUrl || ""}
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
                          value={account.facebookPageUrl || ""}
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
                    <Save className="mr-2 h-4 w-4" /> Save as Profile
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
        </TabsContent>

        <TabsContent value="single">
          <Card className="bg-[#141414] border-[#2C2C2E] shadow-lg overflow-hidden">
            <CardHeader className="border-b border-[#2C2C2E] bg-[#1C1C1E]">
              <CardTitle className="text-xl font-medium">Single Ad Account Application</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Apply for a single ad account with detailed configuration
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // Handle form submission
              }}
            >
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="account-name" className="text-[#E0E0E0]">
                    Account Name
                  </Label>
                  <Input
                    id="account-name"
                    placeholder="Enter a name for this ad account"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-manager-id" className="text-[#E0E0E0]">
                    Business Manager ID
                  </Label>
                  <Input
                    id="business-manager-id"
                    placeholder="Enter your Facebook Business Manager ID"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-[#E0E0E0]">
                    Ad Account Timezone
                  </Label>
                  <Select required>
                    <SelectTrigger className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-[#2C2C2E]">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landing-page-url" className="text-[#E0E0E0]">
                    Landing Page URL
                  </Label>
                  <Input
                    id="landing-page-url"
                    placeholder="https://example.com"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook-page-url" className="text-[#E0E0E0]">
                    Facebook Page URL
                  </Label>
                  <Input
                    id="facebook-page-url"
                    placeholder="https://facebook.com/yourpage"
                    className="bg-[#1C1C1E] border-[#2C2C2E] focus:border-[#b4a0ff] focus:ring-[#b4a0ff]/20"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-[#2C2C2E] pt-6 bg-[#1C1C1E]">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                >
                  Submit Application
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card className="bg-[#141414] border-[#2C2C2E] shadow-lg overflow-hidden">
            <CardHeader className="border-b border-[#2C2C2E] bg-[#1C1C1E]">
              <CardTitle className="text-xl font-medium">Saved Business Profiles</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Manage your saved business profiles for quick applications
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-40 border border-dashed border-[#2C2C2E] rounded-lg">
                <div className="text-center">
                  <Users className="h-10 w-10 text-[#2C2C2E] mx-auto mb-2" />
                  <p className="text-[#A0A0A0]">No saved profiles yet</p>
                  <p className="text-[#A0A0A0] text-sm">Save a profile during application to see it here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
