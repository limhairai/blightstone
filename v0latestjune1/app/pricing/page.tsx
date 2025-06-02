import Link from "next/link"
import { FunnelLayout } from "@/components/funnel-layout"
import { Button } from "@/components/ui/button"
import { PricingPlans } from "@/components/pricing-plans"

export default function PricingPage() {
  return (
    <FunnelLayout title="Choose your plan" subtitle="Everything you need to grow your advertising business">
      <div className="container max-w-7xl mx-auto px-4 pb-12">
        <PricingPlans />

        <div className="mt-20 bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] p-10 rounded-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-transparent bg-clip-text">
              Top-Up Fee Comparison
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Higher tiers offer lower top-up fees, saving you money as your ad spend increases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] p-6 rounded-lg">
              <h3 className="font-bold mb-2">Bronze</h3>
              <p className="text-3xl font-bold text-[#b19cd9] mb-2">6%</p>
              <p className="text-sm text-[#B6BEC4]">$60 fee on $1,000 spend</p>
            </div>

            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] p-6 rounded-lg">
              <h3 className="font-bold mb-2">Silver</h3>
              <p className="text-3xl font-bold text-[#b19cd9] mb-2">4%</p>
              <p className="text-sm text-[#B6BEC4]">$40 fee on $1,000 spend</p>
            </div>

            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#b19cd9] p-6 rounded-lg">
              <h3 className="font-bold mb-2">Gold</h3>
              <p className="text-3xl font-bold text-[#b19cd9] mb-2">3%</p>
              <p className="text-sm text-[#B6BEC4]">$30 fee on $1,000 spend</p>
            </div>

            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] p-6 rounded-lg">
              <h3 className="font-bold mb-2">Diamond</h3>
              <p className="text-3xl font-bold text-[#b19cd9] mb-2">2%</p>
              <p className="text-sm text-[#B6BEC4]">$20 fee on $1,000 spend</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              For agencies and businesses with specific requirements, we offer tailored packages.
            </p>
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-10 py-6 text-lg rounded-lg">
                Contact Our Sales Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </FunnelLayout>
  )
}
