"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApplicationForm } from "@/components/application-form"
import { BatchApplication } from "./batch-application"
import { Check, ArrowRight } from "lucide-react"
import { colors, gradients, shadows } from "@/lib/design-tokens"

export function MultiStepForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formType, setFormType] = useState("single")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/accounts")
    }, 1500)
  }

  return (
    <Card className={`${colors.cardBackground} ${colors.cardBorder} ${shadows.card} overflow-hidden`}>
      {/* Progress Steps */}
      <div className="border-b border-[#2C2C2E] bg-[#1C1C1E] p-4">
        <div className="flex justify-between max-w-md mx-auto">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                  ${
                    step >= stepNumber
                      ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black"
                      : "bg-[#2C2C2E] text-[#A0A0A0]"
                  }`}
              >
                {step > stepNumber ? <Check className="h-5 w-5" /> : <span>{stepNumber}</span>}
              </div>
              <span className={`text-xs ${step >= stepNumber ? "text-white" : "text-[#A0A0A0]"}`}>
                {stepNumber === 1 ? "Account Type" : stepNumber === 2 ? "Details" : "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <CardContent className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium mb-2">Choose Account Type</h2>
              <p className="text-[#A0A0A0]">
                Select whether you want to apply for a single account or multiple accounts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Card
                className={`cursor-pointer border-2 p-6 ${
                  formType === "single" ? "border-[#b4a0ff]" : "border-[#2C2C2E]"
                }`}
                onClick={() => setFormType("single")}
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">1</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Single Account</h3>
                  <p className="text-sm text-[#A0A0A0]">Apply for one ad account with detailed configuration</p>
                </div>
              </Card>

              <Card
                className={`cursor-pointer border-2 p-6 ${
                  formType === "batch" ? "border-[#b4a0ff]" : "border-[#2C2C2E]"
                }`}
                onClick={() => setFormType("batch")}
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">2+</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Batch Application</h3>
                  <p className="text-sm text-[#A0A0A0]">Apply for multiple ad accounts at once</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium mb-2">Account Details</h2>
              <p className="text-[#A0A0A0]">
                Provide information about your {formType === "batch" ? "accounts" : "account"}
              </p>
            </div>

            {formType === "single" ? <ApplicationForm /> : <BatchApplication />}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium mb-2">Review Your Application</h2>
              <p className="text-[#A0A0A0]">Please review your information before submitting</p>
            </div>

            <Card className={`${colors.cardBackground} ${colors.cardBorder} p-4`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[#A0A0A0]">Application Type</h3>
                  <p>{formType === "single" ? "Single Account" : "Batch Application"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#A0A0A0]">Business Manager ID</h3>
                  <p>123456789012345</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#A0A0A0]">Timezone</h3>
                  <p>UTC (Coordinated Universal Time)</p>
                </div>

                {formType === "batch" && (
                  <div>
                    <h3 className="text-sm font-medium text-[#A0A0A0]">Number of Accounts</h3>
                    <p>2 accounts</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-md p-4">
              <p className="text-sm text-[#A0A0A0]">
                By submitting this application, you agree to our terms of service and privacy policy. Applications are
                typically processed within 24-48 hours.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className={`border-t ${colors.cardBorder} p-6 bg-[#1C1C1E] flex justify-between`}>
        {step > 1 ? (
          <Button variant="outline" onClick={prevStep} className="bg-[#1C1C1E] border-[#2C2C2E] hover:bg-[#2C2C2E]">
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <Button onClick={nextStep} className={`${gradients.primaryButton} hover:opacity-90 text-black`}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${gradients.primaryButton} hover:opacity-90 text-black`}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
