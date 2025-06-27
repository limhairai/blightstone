"use client"

import { useState } from "react"
import { CheckCircle, Sparkles, Building2, Target, CreditCard, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Card } from "../ui/card"
import { useAuth } from "../../contexts/AuthContext"
import { useAdvancedOnboarding } from "../../hooks/useAdvancedOnboarding"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface WelcomeOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WelcomeOnboardingModal({ isOpen, onClose }: WelcomeOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()

  const { data: orgData, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );
  const currentOrganization = orgData?.organizations?.[0];
  
  // Use advanced onboarding hook
  const {
    setupProgress,
    completion,
    markStepCompleted,
    dismissOnboarding
  } = useAdvancedOnboarding()

  // Form states
  const [orgName, setOrgName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessWebsite, setBusinessWebsite] = useState("")
  const [description, setDescription] = useState("")

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to AdHub!",
      description: "Let's get your account set up in just a few steps",
      icon: <Sparkles className="h-6 w-6 text-purple-500" />,
      completed: false
    },
    {
      id: "organization",
      title: "Organization Ready", 
      description: "Your organization is set up - customize if needed",
      icon: <Building2 className="h-6 w-6 text-blue-500" />,
      completed: false
    },
    {
      id: "business",
      title: "Business Application",
      description: "Submit your first business for approval",
      icon: <Target className="h-6 w-6 text-green-500" />,
      completed: false
    },
    {
      id: "complete",
      title: "All Set!",
      description: "Your application is under review",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      completed: false
    }
  ]

  const handleNext = async () => {
    if (currentStep === 2) {
      // Business creation step
      if (!businessName.trim()) {
        toast.error("Business name is required.")
        return
      }

      setLoading(true)
      try {
        const response = await fetch('/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: businessName,
            website: businessWebsite,
            description: description,
            organization_id: currentOrganizationId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create business");
        }
        
        // Mark business setup step as completed
        await markStepCompleted('business-setup')
        mutate(`/api/businesses?organization_id=${currentOrganizationId}`);
        
        setCurrentStep(currentStep + 1)
        toast.success("Business created successfully and is under review.")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast.error("Failed to create business", { description: errorMessage });
        console.error('Error creating business:', error)
      } finally {
        setLoading(false)
      }
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - complete onboarding
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Don't dismiss onboarding - let user continue with other steps
      onClose()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  const handleSkip = async () => {
    try {
      await dismissOnboarding()
      onClose()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      onClose()
      router.push('/dashboard')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Welcome to AdHub, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!</h3>
              <p className="text-muted-foreground">
                We're excited to help you manage your Facebook ad accounts. Let's get you set up with everything you need to get started.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Card className="p-4">
                <Building2 className="h-6 w-6 text-blue-500 mb-2" />
                <div className="font-medium">Organization</div>
                <div className="text-muted-foreground">Set up your company</div>
              </Card>
              <Card className="p-4">
                <Target className="h-6 w-6 text-green-500 mb-2" />
                <div className="font-medium">Business</div>
                <div className="text-muted-foreground">Apply for ad accounts</div>
              </Card>
              <Card className="p-4">
                <CreditCard className="h-6 w-6 text-purple-500 mb-2" />
                <div className="font-medium">Funding</div>
                <div className="text-muted-foreground">Add budget for ads</div>
              </Card>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Organization Setup</h3>
              <p className="text-muted-foreground">
                {isOrgLoading ? "Loading..." : currentOrganization 
                  ? `Your organization "${currentOrganization.name}" is ready to go!`
                  : "We'll set up your organization automatically."
                }
              </p>
            </div>
            
            {isOrgLoading ? (
               <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                 <Loader2 className="h-5 w-5 animate-spin" />
               </div>
            ) : currentOrganization && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{currentOrganization.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Plan: {currentOrganization.plan} • Balance: ${currentOrganization.balance_cents / 100}
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name (Optional)</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={currentOrganization?.name || "My Company"}
                  disabled={isOrgLoading}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Your First Business</h3>
              <p className="text-muted-foreground">
                Submit a business application to get started with ad accounts.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessWebsite">Website URL</Label>
                <Input
                  id="businessWebsite"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe your business..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
              <p className="text-muted-foreground">
                Your business application has been submitted and is under review. 
                You can now explore your dashboard and add funds to your wallet.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add funds to your wallet</li>
                <li>• Wait for business approval</li>
                <li>• Apply for ad accounts</li>
                <li>• Start running ads!</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to AdHub</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px] flex flex-col justify-between">
          <div className="flex-1">
            {renderStepContent()}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={loading || (currentStep === 2 && !businessName.trim())}
              >
                {loading ? (
                  "Creating..."
                ) : currentStep === steps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 