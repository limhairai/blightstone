"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Users, UserPlus, ShieldCheck } from "lucide-react"
import Image from "next/image"

export function EmptyAccounts() {
  const accountTypes = [
    {
      icon: <UserPlus className="h-5 w-5 text-[#b4a0ff]" />,
      title: "Single Account",
      description: "Apply for a single ad account for your business or personal use.",
      href: "/accounts/apply",
    },
    {
      icon: <Users className="h-5 w-5 text-[#b4a0ff]" />,
      title: "Batch Accounts",
      description: "Apply for multiple ad accounts simultaneously for larger operations.",
      href: "/accounts/apply/batch-application",
    },
  ]

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ad Accounts</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-12 max-w-4xl mx-auto text-center px-4">
        <div className="relative w-64 h-64 mb-6">
          <Image
            src="/placeholder-wnxxg.png"
            alt="Ad Accounts"
            width={256}
            height={256}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-2xl font-bold mb-3">You Don't Have Any Ad Accounts Yet</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Create your first ad account to start advertising on popular platforms.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
          {accountTypes.map((type, index) => (
            <div key={index} className="bg-[#111111] border border-[#333333] p-6 rounded-lg flex flex-col h-full">
              <div className="h-10 w-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4">
                {type.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 flex-1">{type.description}</p>
              <Link href={type.href} className="mt-auto">
                <Button variant="outline" className="w-full border-[#333333] bg-[#1A1A1A] hover:bg-[#252525]">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-[#0F0F0F] border border-[#333333] p-6 rounded-lg w-full max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#b4a0ff]" />
            </div>
            <h3 className="text-lg font-semibold">Why Choose AdHub?</h3>
          </div>
          <ul className="text-left text-sm text-muted-foreground space-y-2 mb-4">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Automated approval process for faster account creation
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Easy fund management across multiple ad accounts
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              Detailed performance analytics and reporting
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">✓</span>
              24/7 dedicated customer support
            </li>
          </ul>
          <Button className="bg-gradient-to-r from-purple-600 to-orange-400 hover:opacity-90 text-black w-full" asChild>
            <Link href="/accounts/apply">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
