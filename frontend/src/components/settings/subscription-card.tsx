import { CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tag } from "@/components/ui/tag"

export function SubscriptionCard() {
  return (
    <Card className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border-[#222] p-6 max-w-md">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Business Plan</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-white">$299</span>
              <span className="text-sm text-gray-400">per month</span>
            </div>
          </div>
          <Tag variant="current" rounded="full" className="px-3 py-1">
            Active
          </Tag>
        </div>

        {/* Features */}
        <div className="flex-1 mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">Included Features</h4>
          <div className="space-y-3">
            {["Unlimited ad accounts", "Priority support", "Advanced analytics", "Team collaboration"].map(
              (feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-gray-200 text-sm">{feature}</span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Trial Warning */}
        <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-orange-400 text-sm font-medium">Trial ends May 29, 2025</p>
              <p className="text-orange-300 text-xs mt-0.5">Upgrade to continue using premium features</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 font-medium">
          Manage Subscription
        </Button>
      </div>
    </Card>
  )
}
