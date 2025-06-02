"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Check, Slack, Mail, BellIcon as BrandTelegram } from "lucide-react"

interface SupportChannelSetupProps {
  data: {
    type: string
    email: string
    handle: string
  }
  updateData: (data: Partial<SupportChannelSetupProps["data"]>) => void
  onSubmit: () => void
  onBack: () => void
  loading?: boolean
  disabled?: boolean
}

export function SupportChannelSetup({ data, updateData, onSubmit, onBack, loading = false, disabled = false }: SupportChannelSetupProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (data.type === "email" && !data.email.trim()) {
      newErrors.email = "Email is required"
    } else if (data.type === "email" && !/^\S+@\S+\.\S+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if ((data.type === "slack" || data.type === "telegram") && !data.handle.trim()) {
      newErrors.handle = `${data.type === "slack" ? "Slack" : "Telegram"} handle is required`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConnect = async () => {
    if (!validateForm()) return

    setIsConnecting(true)

    // Simulate connection process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsConnecting(false)
    setIsConnected(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (data.type === "email" || isConnected) {
      onSubmit()
    } else if (!isConnected) {
      setErrors({ connection: "Please connect your support channel before continuing" })
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="space-y-2 text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Set up support channel</h1>
        <p className="text-xs sm:text-sm text-[#71717a]">
          Connect your preferred support channel for seamless communication
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs
          value={data.type}
          onValueChange={(value) => {
            updateData({ type: value })
            setIsConnected(false)
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full text-xs sm:text-sm">
            <TabsTrigger value="slack" className="flex items-center gap-2">
              <Slack className="h-4 w-4" /> Slack
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <BrandTelegram className="h-4 w-4" /> Telegram
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slack" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="slack-handle">Slack Workspace URL</Label>
              <Input
                id="slack-handle"
                value={data.handle}
                onChange={(e) => updateData({ handle: e.target.value })}
                placeholder="your-workspace.slack.com"
                disabled={isConnected}
                className={errors.handle ? "border-red-500" : ""}
              />
              {errors.handle && <p className="text-sm text-red-500">{errors.handle}</p>}
            </div>

            {!isConnected ? (
              <Button type="button" onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? "Connecting..." : "Connect Slack"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-md">
                <Check className="h-5 w-5" />
                <span>Slack workspace connected successfully</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="telegram" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-handle">Telegram Username or Group</Label>
              <Input
                id="telegram-handle"
                value={data.handle}
                onChange={(e) => updateData({ handle: e.target.value })}
                placeholder="@username or group name"
                disabled={isConnected}
                className={errors.handle ? "border-red-500" : ""}
              />
              {errors.handle && <p className="text-sm text-red-500">{errors.handle}</p>}
            </div>

            {!isConnected ? (
              <Button type="button" onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? "Connecting..." : "Connect Telegram"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-md">
                <Check className="h-5 w-5" />
                <span>Telegram account connected successfully</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email Address</Label>
              <Input
                id="support-email"
                type="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                placeholder="support@yourcompany.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </TabsContent>
        </Tabs>

        {errors.connection && <p className="text-sm text-red-500 text-center">{errors.connection}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="mb-2 sm:mb-0 sm:flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            type="submit"
            className="sm:flex-1 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
            disabled={disabled || isConnecting}
          >
            {loading ? "Processing..." : "Complete Setup"}
          </Button>
        </div>
      </form>
    </div>
  )
}
