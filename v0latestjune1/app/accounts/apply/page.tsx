import { FunnelLayout } from "@/components/funnel-layout"
import { MultiStepForm } from "./multi-step-form"

export default function AccountApplicationPage() {
  return (
    <FunnelLayout
      title="Ad Account Application"
      subtitle="Apply for new ad accounts by providing your business details and account requirements."
    >
      <div className="max-w-4xl mx-auto px-4">
        <MultiStepForm />
      </div>
    </FunnelLayout>
  )
}
