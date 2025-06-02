"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CreditCard, WalletIcon, RefreshCw } from "lucide-react"
import Image from "next/image"

export function EmptyWallet() {
  const fundingOptions = [
    {
      icon: <CreditCard className="h-5 w-5 text-purple-400" />,
      title: "Credit Card",
      description: "Add funds instantly using your credit or debit card",
      primary: true,
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-purple-400" />,
      title: "Bank Transfer",
      description: "Transfer funds directly from your bank account",
      primary: false,
    },
    {
      icon: <WalletIcon className="h-5 w-5 text-purple-400" />,
      title: "Crypto Payment",
      description: "Add funds using cryptocurrency",
      primary: false,
    },
  ]

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wallet</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-12 max-w-4xl mx-auto text-center px-4">
        <div className="relative w-64 h-64 mb-6">
          <Image
            src="/placeholder-qutmw.png"
            alt="Wallet"
            width={256}
            height={256}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-2xl font-bold mb-3">Your Wallet is Empty</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Top up your wallet to fund ad accounts and manage your advertising campaigns.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
          {fundingOptions.map((option, index) => (
            <div
              key={index}
              className={`border p-6 rounded-lg flex flex-col h-full ${
                option.primary
                  ? "bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#444444]"
                  : "bg-gray-50 dark:bg-[#111111] border-gray-200 dark:border-[#333333]"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-[#1A1A1A] flex items-center justify-center mb-4">
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 flex-1">{option.description}</p>
              <Button
                variant={option.primary ? "default" : "outline"}
                className={
                  option.primary
                    ? "bg-gradient-to-r from-purple-600 to-orange-400 hover:opacity-90 text-white mt-auto"
                    : "border-gray-300 dark:border-[#333333] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#252525] mt-auto"
                }
              >
                Top Up with {option.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#333333] p-6 rounded-lg w-full max-w-xl">
          <h3 className="text-lg font-semibold mb-2">Need Ad Accounts First?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Apply for ad accounts to start running your advertising campaigns.
          </p>
          <Button
            variant="outline"
            className="border-gray-300 dark:border-[#333333] bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#252525]"
            asChild
          >
            <Link href="/accounts/apply">
              Apply for Ad Accounts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
