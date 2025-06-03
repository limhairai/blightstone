"use client"

import { Heart, Mail, Keyboard, CreditCard, User } from "lucide-react"

interface PreferencesPageProps {
  email: string
  userName: string
  trialEndDate?: string
}

export function PreferencesPage({ email, userName, trialEndDate }: PreferencesPageProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Preferences</h1>
          <p className="text-[#8A8A8D]">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]">Gift to a friend</button>
          <button className="px-4 py-2 rounded bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]">Sign out</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-medium mb-2">Your Account</h2>

          <div className="bg-[#1C1C1E] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User size={18} className="text-[#8A8A8D]" />
              <div>
                <div className="font-medium">{userName}</div>
                <div className="text-sm text-[#8A8A8D]">{email}</div>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-xs">
              {userName.charAt(0)}
            </div>
          </div>

          <div className="bg-[#1C1C1E] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-[#8A8A8D]" />
              <div>
                <div className="font-medium">Payment method</div>
                <div className="text-sm text-[#8A8A8D]">Visa **** 3111</div>
              </div>
            </div>
            <div className="h-10 w-16 bg-black rounded-md flex items-center justify-center text-white font-bold">
              VISA
            </div>
          </div>

          <div className="bg-[#1C1C1E] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[#8A8A8D]" />
              <div>
                <div className="font-medium">Communication</div>
                <div className="text-sm text-[#8A8A8D]">Manage your email newsletter, get help, or join our Slack.</div>
              </div>
            </div>
            <div className="h-10 w-16 bg-[#2C2C2E] rounded-md"></div>
          </div>

          <div className="bg-[#1C1C1E] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Keyboard size={18} className="text-[#8A8A8D]" />
              <div>
                <div className="font-medium">Shortcuts</div>
                <div className="text-sm text-[#8A8A8D]">Press ? anytime for a cheat sheet.</div>
              </div>
            </div>
            <div className="h-10 w-16 bg-[#2C2C2E] rounded-md"></div>
          </div>

          <div className="bg-[#1C1C1E] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-[#8A8A8D]" />
              <div>
                <div className="font-medium">Share feedback</div>
                <div className="text-sm text-[#8A8A8D]">Bugs, suggestions or simple hello?</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Subscription</h2>
          <div className="bg-[#1C1C1E] rounded-md p-6">
            <div className="text-center mb-6">
              <div className="text-6xl font-light text-white/30 mb-2">
                <span className="text-white text-7xl font-normal">$30</span>
              </div>
              <div className="uppercase text-xs tracking-wider bg-[#2C2C2E] inline-block px-2 py-0.5 rounded-sm">
                Monthly plan
              </div>
            </div>

            {trialEndDate && (
              <div className="mb-6">
                <h3 className="text-center font-medium mb-2">Trial ends: {trialEndDate}</h3>
                <p className="text-xs text-center text-[#8A8A8D]">
                  For peace of mind, we&apos;ll send you an email 24 hours before your first payment.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button className="w-full py-2 rounded bg-gradient-to-r from-[#0A84FF] to-[#6A84FF] text-white">
                Manage subscription
              </button>
              <button className="w-full py-2 rounded bg-transparent text-[#8A8A8D]">View billing history</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
