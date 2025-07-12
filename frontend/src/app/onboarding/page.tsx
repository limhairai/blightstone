"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"
import { AdHubLogo } from "../../components/core/AdHubLogo"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, supabase } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [orgName, setOrgName] = useState("")
  const [industry, setIndustry] = useState("")
  const [monthlySpend, setMonthlySpend] = useState("")
  const [timezone, setTimezone] = useState("")
  const [howHeardAboutUs, setHowHeardAboutUs] = useState("")

  const totalSteps = 6

  const questions = [
    {
      id: 1,
      title: "",
      subtitle: "",
      component: (
        <div className="relative min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Welcome to <span className="text-white">Ad</span><span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">Hub</span>
            </h1>
            <div className="space-y-4">
              <p className="text-base text-muted-foreground">
                We'll collect a few details to personalize your experience
              </p>
              <p className="text-sm text-muted-foreground/80">
                This will only take a minute
              </p>
            </div>
          </div>
        </div>
      ),
      isValid: () => true
    },
    {
      id: 2,
      title: "What's the name of your organization?",
      subtitle: "This will be displayed on your dashboard and in communications.",
      component: (
        <div className="space-y-4">
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Enter your organization name"
            className="h-14 text-lg border-2 focus:border-primary transition-all duration-300 focus:scale-105 focus:shadow-lg bg-background/50 backdrop-blur-sm"
            autoFocus
          />
        </div>
      ),
      isValid: () => orgName.trim() !== ""
    },
    {
      id: 3,
      title: "What industry are you in?",
      subtitle: "This helps us understand your business and provide better support.",
      component: (
        <div className="space-y-4">
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-14 text-lg border-2 focus:border-primary transition-all duration-300 hover:scale-105 focus-visible:scale-105 hover:shadow-lg focus-visible:shadow-lg bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
              <SelectItem value="ecommerce" className="cursor-pointer hover:bg-accent/50 transition-colors">E-commerce</SelectItem>
              <SelectItem value="saas" className="cursor-pointer hover:bg-accent/50 transition-colors">SaaS</SelectItem>
              <SelectItem value="agency" className="cursor-pointer hover:bg-accent/50 transition-colors">Marketing Agency</SelectItem>
              <SelectItem value="consulting" className="cursor-pointer hover:bg-accent/50 transition-colors">Consulting</SelectItem>
              <SelectItem value="healthcare" className="cursor-pointer hover:bg-accent/50 transition-colors">Healthcare</SelectItem>
              <SelectItem value="finance" className="cursor-pointer hover:bg-accent/50 transition-colors">Finance</SelectItem>
              <SelectItem value="education" className="cursor-pointer hover:bg-accent/50 transition-colors">Education</SelectItem>
              <SelectItem value="real-estate" className="cursor-pointer hover:bg-accent/50 transition-colors">Real Estate</SelectItem>
              <SelectItem value="retail" className="cursor-pointer hover:bg-accent/50 transition-colors">Retail</SelectItem>
              <SelectItem value="travel" className="cursor-pointer hover:bg-accent/50 transition-colors">Travel & Hospitality</SelectItem>
              <SelectItem value="other" className="cursor-pointer hover:bg-accent/50 transition-colors">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      isValid: () => industry !== ""
    },
    {
      id: 4,
      title: "What's your monthly advertising spend?",
      subtitle: "This helps us recommend the right plan for your needs.",
      component: (
        <div className="space-y-4">
          <Select value={monthlySpend} onValueChange={setMonthlySpend}>
            <SelectTrigger className="h-14 text-lg border-2 focus:border-primary transition-all duration-300 hover:scale-105 focus-visible:scale-105 hover:shadow-lg focus-visible:shadow-lg bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select your monthly ad spend" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
              <SelectItem value="0-1000" className="cursor-pointer hover:bg-accent/50 transition-colors">$0 - $1,000</SelectItem>
              <SelectItem value="1000-5000" className="cursor-pointer hover:bg-accent/50 transition-colors">$1,000 - $5,000</SelectItem>
              <SelectItem value="5000-10000" className="cursor-pointer hover:bg-accent/50 transition-colors">$5,000 - $10,000</SelectItem>
              <SelectItem value="10000-25000" className="cursor-pointer hover:bg-accent/50 transition-colors">$10,000 - $25,000</SelectItem>
              <SelectItem value="25000-50000" className="cursor-pointer hover:bg-accent/50 transition-colors">$25,000 - $50,000</SelectItem>
              <SelectItem value="50000-100000" className="cursor-pointer hover:bg-accent/50 transition-colors">$50,000 - $100,000</SelectItem>
              <SelectItem value="100000+" className="cursor-pointer hover:bg-accent/50 transition-colors">$100,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      isValid: () => monthlySpend !== ""
    },
    {
      id: 5,
      title: "What's your timezone?",
      subtitle: "We'll use this to schedule your business managers and provide support during your business hours.",
      component: (
        <div className="space-y-4">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="h-14 text-lg border-2 focus:border-primary transition-all duration-300 hover:scale-105 focus-visible:scale-105 hover:shadow-lg focus-visible:shadow-lg bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
              <SelectItem value="UTC-12" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-12 (Baker Island)</SelectItem>
              <SelectItem value="UTC-11" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-11 (American Samoa)</SelectItem>
              <SelectItem value="UTC-10" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-10 (Hawaii)</SelectItem>
              <SelectItem value="UTC-9" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-9 (Alaska)</SelectItem>
              <SelectItem value="UTC-8" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-8 (Pacific Time)</SelectItem>
              <SelectItem value="UTC-7" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-7 (Mountain Time)</SelectItem>
              <SelectItem value="UTC-6" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-6 (Central Time)</SelectItem>
              <SelectItem value="UTC-5" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-5 (Eastern Time)</SelectItem>
              <SelectItem value="UTC-4" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-4 (Atlantic Time)</SelectItem>
              <SelectItem value="UTC-3" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-3 (Argentina)</SelectItem>
              <SelectItem value="UTC-2" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-2 (South Georgia)</SelectItem>
              <SelectItem value="UTC-1" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC-1 (Azores)</SelectItem>
              <SelectItem value="UTC+0" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+0 (London, Dublin)</SelectItem>
              <SelectItem value="UTC+1" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+1 (Paris, Berlin)</SelectItem>
              <SelectItem value="UTC+2" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+2 (Cairo, Helsinki)</SelectItem>
              <SelectItem value="UTC+3" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+3 (Moscow, Istanbul)</SelectItem>
              <SelectItem value="UTC+4" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+4 (Dubai, Baku)</SelectItem>
              <SelectItem value="UTC+5" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+5 (Karachi, Tashkent)</SelectItem>
              <SelectItem value="UTC+6" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+6 (Dhaka, Almaty)</SelectItem>
              <SelectItem value="UTC+7" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+7 (Bangkok, Jakarta)</SelectItem>
              <SelectItem value="UTC+8" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+8 (Beijing, Singapore)</SelectItem>
              <SelectItem value="UTC+9" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+9 (Tokyo, Seoul)</SelectItem>
              <SelectItem value="UTC+10" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+10 (Sydney, Melbourne)</SelectItem>
              <SelectItem value="UTC+11" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+11 (Solomon Islands)</SelectItem>
              <SelectItem value="UTC+12" className="cursor-pointer hover:bg-accent/50 transition-colors">UTC+12 (New Zealand)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      isValid: () => timezone !== ""
    },
    {
      id: 6,
      title: "How did you hear about AdHub?",
      subtitle: "This helps us understand which channels work best so we can improve our service.",
      component: (
        <div className="space-y-4">
          <Select value={howHeardAboutUs} onValueChange={setHowHeardAboutUs}>
            <SelectTrigger className="h-14 text-lg border-2 focus:border-primary transition-all duration-300 hover:scale-105 focus-visible:scale-105 hover:shadow-lg focus-visible:shadow-lg bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select how you found us" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
              <SelectItem value="google" className="cursor-pointer hover:bg-accent/50 transition-colors">Google Search</SelectItem>
              <SelectItem value="social-media" className="cursor-pointer hover:bg-accent/50 transition-colors">Social Media</SelectItem>
              <SelectItem value="referral" className="cursor-pointer hover:bg-accent/50 transition-colors">Referral from Friend/Colleague</SelectItem>
              <SelectItem value="blog" className="cursor-pointer hover:bg-accent/50 transition-colors">Blog/Article</SelectItem>
              <SelectItem value="youtube" className="cursor-pointer hover:bg-accent/50 transition-colors">YouTube</SelectItem>
              <SelectItem value="podcast" className="cursor-pointer hover:bg-accent/50 transition-colors">Podcast</SelectItem>
              <SelectItem value="conference" className="cursor-pointer hover:bg-accent/50 transition-colors">Conference/Event</SelectItem>
              <SelectItem value="reddit" className="cursor-pointer hover:bg-accent/50 transition-colors">Reddit</SelectItem>
              <SelectItem value="facebook-group" className="cursor-pointer hover:bg-accent/50 transition-colors">Facebook Group</SelectItem>
              <SelectItem value="linkedin" className="cursor-pointer hover:bg-accent/50 transition-colors">LinkedIn</SelectItem>
              <SelectItem value="other" className="cursor-pointer hover:bg-accent/50 transition-colors">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      isValid: () => howHeardAboutUs !== ""
    }
  ]

  const currentQuestion = questions[currentStep - 1]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    try {
      // Get auth token for API request
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      if (!token) {
        throw new Error('Authentication required')
      }

      // Update organization with collected information
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: orgName,
          industry: industry,
          ad_spend_monthly: monthlySpend,
          timezone: timezone,
          how_heard_about_us: howHeardAboutUs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update organization')
      }

      toast.success("Welcome to AdHub! Explore your dashboard and upgrade when ready.")
      router.push('/dashboard?welcome=true')
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error("Failed to complete setup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="h-1 bg-muted">
          <div 
            className="h-1 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <AdHubLogo size="lg" />
          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <button
              onClick={() => router.push('/dashboard?welcome=true')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-6">
        <div className="max-w-xl mx-auto">
          <div className="min-h-[60vh] flex flex-col justify-center">
            {/* Question */}
            <div className="space-y-8 animate-in fade-in-0 duration-300" key={`question-${currentStep}`}>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-foreground leading-tight">
                  {currentQuestion.title}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {currentQuestion.subtitle}
                </p>
              </div>

              {/* Answer Component */}
              <div className="w-full">
                {currentQuestion.component}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-6">
            <div className="max-w-2xl mx-auto flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!currentQuestion.isValid()}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:from-[#a690ff] hover:to-[#ff9a90] text-black px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!currentQuestion.isValid() || loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:from-[#a690ff] hover:to-[#ff9a90] text-black px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 