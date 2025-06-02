"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { SingleAccountForm } from "@/components/single-account-form"
import { BatchAccountForm } from "@/components/batch-account-form"

export default function AccountApplicationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formType, setFormType] = useState<"single" | "batch">("single")
  const [formData, setFormData] = useState({
    businessManagerId: "",
    timezone: "",
    accounts: [
      {
        id: 1,
        name: "",
        landingPageUrl: "",
        facebookPageUrl: "",
      },
    ],
  })

  const handleFormTypeChange = (value: string) => {
    setFormType(value as "single" | "batch")
  }

  const handleFormDataChange = (data: any) => {
    // Only update if data has actually changed to prevent infinite loops
    const hasChanged =
      data.businessManagerId !== formData.businessManagerId ||
      data.timezone !== formData.timezone ||
      JSON.stringify(data.accounts) !== JSON.stringify(formData.accounts)

    if (hasChanged) {
      setFormData(data)
    }
  }

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Application submitted successfully",
        description: "We'll review your application and get back to you soon.",
      })
      setIsSubmitting(false)
      router.push("/accounts")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with logo and back button */}
      <header className="border-b border-[#222] py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text"
          >
            AdHub
          </Link>
          <Link href="/accounts" className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to accounts
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <h1 className="text-2xl font-medium text-white text-center mb-2">Ad Account Application</h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Apply for new ad accounts by providing your business details
        </p>

        <div className="max-w-2xl mx-auto w-full bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-lg shadow-lg overflow-hidden">
          {/* Progress Steps */}
          <div className="px-8 py-6 border-b border-[#222]">
            <div className="flex justify-between items-center relative">
              {/* Background line - always gray */}
              <div
                className="absolute top-5 left-0 right-0 h-[1px] bg-[#333]"
                style={{ width: "100%", zIndex: 1 }}
              ></div>

              {/* Progress line - colored based on step */}
              <div
                className="absolute top-5 left-0 h-[1px] bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] transition-all duration-300 ease-in-out"
                style={{
                  width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                  zIndex: 2,
                }}
              ></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${
                    currentStep > 1
                      ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"
                      : currentStep === 1
                        ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"
                        : "bg-[#1a1a1a]"
                  }`}
                >
                  {currentStep > 1 ? (
                    <CheckCircle2 className="h-5 w-5 text-black" />
                  ) : (
                    <span className="text-sm font-medium text-black">1</span>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium">Account Type</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${
                    currentStep > 2
                      ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"
                      : currentStep === 2
                        ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"
                        : "bg-[#1a1a1a]"
                  }`}
                >
                  {currentStep > 2 ? (
                    <CheckCircle2 className="h-5 w-5 text-black" />
                  ) : (
                    <span className={`text-sm font-medium ${currentStep === 2 ? "text-black" : "text-gray-600"}`}>
                      2
                    </span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= 2 ? "text-white" : "text-gray-600"}`}>
                  Account Details
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${currentStep === 3 ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]" : "bg-[#1a1a1a]"}`}
                >
                  <span className={`text-sm font-medium ${currentStep === 3 ? "text-black" : "text-gray-600"}`}>3</span>
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= 3 ? "text-white" : "text-gray-600"}`}>
                  Review
                </span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-medium text-white mb-6">Choose Account Type</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div
                    className={`border-2 rounded-lg p-5 cursor-pointer transition-all duration-200 
                    ${
                      formType === "single"
                        ? "border-[#b4a0ff] bg-black"
                        : "border-[#222] bg-[#111] hover:border-[#444]"
                    }`}
                    onClick={() => setFormType("single")}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
                          1
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Single Account</h3>
                        <p className="text-xs text-[#999]">One ad account with detailed configuration</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-5 cursor-pointer transition-all duration-200 
                    ${
                      formType === "batch" ? "border-[#b4a0ff] bg-black" : "border-[#222] bg-[#111] hover:border-[#444]"
                    }`}
                    onClick={() => setFormType("batch")}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
                          2+
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Multiple Accounts</h3>
                        <p className="text-xs text-[#999]">Apply for multiple ad accounts at once</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 transition-opacity px-4 py-1.5 h-9 text-sm font-medium rounded"
                  >
                    Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-medium text-white mb-6">
                  {formType === "single" ? "Single Account Details" : "Multiple Accounts Details"}
                </h2>

                {formType === "single" ? (
                  <SingleAccountForm formData={formData} onChange={handleFormDataChange} />
                ) : (
                  <BatchAccountForm formData={formData} onChange={handleFormDataChange} />
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white px-4 py-1.5 h-9 text-sm font-medium rounded"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 transition-opacity px-4 py-1.5 h-9 text-sm font-medium rounded"
                  >
                    Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-medium text-white mb-6">Review Your Application</h2>

                <div className="space-y-4">
                  <div className="bg-[#111] border border-[#222] rounded-lg p-5">
                    <h3 className="text-sm font-medium mb-4 text-[#b4a0ff]">Application Summary</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-[#222]">
                        <span className="text-xs text-[#999]">Application Type</span>
                        <span className="text-xs font-medium">
                          {formType === "single" ? "Single Account" : "Multiple Accounts"}
                        </span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-[#222]">
                        <span className="text-xs text-[#999]">Business Manager ID</span>
                        <span className="text-xs font-medium">{formData.businessManagerId || "Not provided"}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-[#222]">
                        <span className="text-xs text-[#999]">Timezone</span>
                        <span className="text-xs font-medium">{formData.timezone || "Not selected"}</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-[#222]">
                        <span className="text-xs text-[#999]">Number of Accounts</span>
                        <span className="text-xs font-medium">{formData.accounts.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111] border border-[#222] rounded-lg p-5">
                    <p className="text-xs text-[#999]">
                      By submitting this application, you agree to our terms of service and privacy policy. Applications
                      are typically processed within 24-48 hours.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white px-4 py-1.5 h-9 text-sm font-medium rounded"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 transition-opacity px-4 py-1.5 h-9 text-sm font-medium rounded"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
