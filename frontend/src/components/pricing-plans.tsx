import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Shield, Award, Zap, Diamond, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PricingPlanProps {
  title: string
  icon: ReactNode
  price: string
  period?: string
  billingNote?: string
  description: string
  topUpFee: string
  features: string[]
  negativeFeatures?: string[]
  buttonText: string
  buttonLink: string
  popular?: boolean
}

function PricingPlan({
  title,
  icon,
  price,
  period = "per month",
  billingNote,
  description,
  topUpFee,
  features,
  negativeFeatures = [],
  buttonText,
  buttonLink,
  popular = false,
}: PricingPlanProps) {
  return (
    <div
      className={`h-full flex flex-col rounded-lg ${
        popular ? "border border-[#b19cd9]" : "border border-[#222]"
      } relative bg-gradient-to-br from-[#111111] to-[#0a0a0a]`}
    >
      {popular && (
        <div className="absolute top-3 right-3">
          <span className="bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black text-xs font-medium px-3 py-1 rounded-full">
            Popular
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-xl font-bold">{title}</h3>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-sm text-[#B6BEC4] ml-1">{period}</span>
          </div>
          {billingNote && <div className="text-xs text-[#B6BEC4] mt-1">{billingNote}</div>}
        </div>

        <div className="mb-4">
          <p className="text-sm text-[#B6BEC4]">{description}</p>
          <p className="text-sm font-medium text-[#b19cd9] mt-1">{topUpFee}</p>
        </div>

        <div className="mb-6">
          <Link href={buttonLink} className="w-full block">
            <Button
              className={`w-full h-10 rounded-lg ${
                popular
                  ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
                  : "bg-[#111] border border-[#222] hover:bg-[#181818] text-white"
              }`}
            >
              {buttonText}
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 border-t border-[#222222]">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-[#b19cd9] mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#D0D0D0]">{feature}</span>
            </li>
          ))}

          {negativeFeatures.map((feature, index) => (
            <li key={`neg-${index}`} className="flex items-start opacity-50">
              <X className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-500">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PricingPlans() {
  return (
    <Tabs defaultValue="monthly" className="w-full">
      <div className="flex justify-center mb-10">
        <div className="bg-[#111] border border-[#222] p-1 rounded-full flex">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="monthly"
              className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#b4a0ff] data-[state=active]:to-[#ffb4a0] data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#B6BEC4] transition-all duration-200"
            >
              Monthly billing
            </TabsTrigger>
            <TabsTrigger
              value="annual"
              className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#b4a0ff] data-[state=active]:to-[#ffb4a0] data-[state=active]:text-black data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-[#181818] data-[state=inactive]:text-[#B6BEC4] transition-all duration-200"
            >
              Annual billing
              <span className="ml-2 bg-[#b19cd9] text-black text-xs px-2 py-0.5 rounded-full">Save 20%</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="monthly" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bronze Plan */}
          <PricingPlan
            title="Bronze"
            icon={<Shield className="h-6 w-6 text-[#B6BEC4]" />}
            price="$0"
            description="Up to $10k/month in ad spend"
            topUpFee="6% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            features={[
              "Up to $1k daily spending",
              "Up to $10k monthly spending",
              "Account pool of 1",
              "Unlimited replacements",
            ]}
            negativeFeatures={["Free asset replacement"]}
          />

          {/* Silver Plan */}
          <PricingPlan
            title="Silver"
            icon={<Award className="h-6 w-6 text-[#D0D0D0]" />}
            price="$299"
            description="Up to $30k/month in ad spend"
            topUpFee="4% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            features={[
              "$1k-$3k daily spending",
              "Up to $30k monthly spending",
              "Account pool of 3",
              "Unlimited replacements",
            ]}
            negativeFeatures={["Free asset replacement"]}
          />

          {/* Gold Plan */}
          <PricingPlan
            title="Gold"
            icon={<Zap className="h-6 w-6 text-[#F3D34A]" />}
            price="$799"
            description="Up to $100k/month in ad spend"
            topUpFee="3% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            popular={true}
            features={[
              "Up to $100k monthly cap",
              "Account pool of 5",
              "Unlimited replacements",
              "Free asset replacement (BM, Pages)",
            ]}
          />

          {/* Diamond Plan */}
          <PricingPlan
            title="Diamond"
            icon={<Diamond className="h-6 w-6 text-[#9AAAAD]" />}
            price="$2,499"
            description="$300k+ monthly ad spend"
            topUpFee="2% top-up fee"
            buttonText="Contact Sales"
            buttonLink="/contact"
            features={[
              "$300k+ monthly spending",
              "Unlimited account pool",
              "Unlimited replacements",
              "Free asset replacement",
              "Post-pay available",
              "Exclusive services",
            ]}
          />
        </div>
      </TabsContent>

      <TabsContent value="annual" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bronze Plan Annual */}
          <PricingPlan
            title="Bronze"
            icon={<Shield className="h-6 w-6 text-[#B6BEC4]" />}
            price="$0"
            description="Up to $10k/month in ad spend"
            topUpFee="6% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            features={[
              "Up to $1k daily spending",
              "Up to $10k monthly spending",
              "Account pool of 1",
              "Unlimited replacements",
            ]}
            negativeFeatures={["Free asset replacement"]}
          />

          {/* Silver Plan Annual */}
          <PricingPlan
            title="Silver"
            icon={<Award className="h-6 w-6 text-[#D0D0D0]" />}
            price="$239"
            period="per month"
            billingNote="billed annually at $2,870"
            description="Up to $30k/month in ad spend"
            topUpFee="4% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            features={[
              "$1k-$3k daily spending",
              "Up to $30k monthly spending",
              "Account pool of 3",
              "Unlimited replacements",
            ]}
            negativeFeatures={["Free asset replacement"]}
          />

          {/* Gold Plan Annual */}
          <PricingPlan
            title="Gold"
            icon={<Zap className="h-6 w-6 text-[#F3D34A]" />}
            price="$639"
            period="per month"
            billingNote="billed annually at $7,670"
            description="Up to $100k/month in ad spend"
            topUpFee="3% top-up fee"
            buttonText="Get Started"
            buttonLink="/register"
            popular={true}
            features={[
              "Up to $100k monthly cap",
              "Account pool of 5",
              "Unlimited replacements",
              "Free asset replacement (BM, Pages)",
            ]}
          />

          {/* Diamond Plan Annual */}
          <PricingPlan
            title="Diamond"
            icon={<Diamond className="h-6 w-6 text-[#9AAAAD]" />}
            price="$1,999"
            period="per month"
            billingNote="billed annually at $23,990"
            description="$300k+ monthly ad spend"
            topUpFee="2% top-up fee"
            buttonText="Contact Sales"
            buttonLink="/contact"
            features={[
              "$300k+ monthly spending",
              "Unlimited account pool",
              "Unlimited replacements",
              "Free asset replacement",
              "Post-pay available",
              "Exclusive services",
            ]}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
