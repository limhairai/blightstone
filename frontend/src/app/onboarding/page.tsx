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
import { BlightstoneLogo } from "../../components/core/BlightstoneLogo"

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
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">
              Welcome to Ad<span className="bg-primary bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-lg text-gray-400">
              Let's get your account set up in just a few steps.
            </p>
          </div>
        </div>
      ),
      isValid: () => true
    },
    {
      id: 2,
      title: "What's the name of your team?",
      subtitle: "",
      component: (
        <div className="space-y-4">
          <div className="relative">
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Your Team Name"
              className="h-12 bg-gray-900 border-gray-700 text-white rounded-md w-full"
              autoFocus
            />
          </div>
          {orgName && (
            <div className="text-sm text-gray-400">
              Your team will be called: <span className="font-medium text-white">{orgName}'s Team</span>
            </div>
          )}
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
            <SelectTrigger className="h-12 bg-gray-900 border-gray-700 text-white rounded-md">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto bg-gray-900 border-gray-700 text-white">
              <SelectItem value="ecommerce" className="cursor-pointer hover:bg-gray-800 transition-colors">E-commerce</SelectItem>
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
            <SelectTrigger className="h-12 bg-gray-900 border-gray-700 text-white rounded-md">
              <SelectValue placeholder="Select your monthly ad spend" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto bg-gray-900 border-gray-700 text-white">
              <SelectItem value="1000-10000" className="cursor-pointer hover:bg-gray-800 transition-colors">$1K - $10K</SelectItem>
              <SelectItem value="10000-100000" className="cursor-pointer hover:bg-accent/50 transition-colors">$10K - $100K</SelectItem>
              <SelectItem value="100000-500000" className="cursor-pointer hover:bg-accent/50 transition-colors">$100K - $500K</SelectItem>
              <SelectItem value="500000-1000000" className="cursor-pointer hover:bg-accent/50 transition-colors">$500K - $1M</SelectItem>
              <SelectItem value="1000000+" className="cursor-pointer hover:bg-accent/50 transition-colors">$1M+</SelectItem>
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
            <SelectTrigger className="h-12 bg-gray-900 border-gray-700 text-white rounded-md">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto bg-gray-900 border-gray-700 text-white">
              <SelectItem value="UTC-12" className="cursor-pointer hover:bg-gray-800 transition-colors">UTC-12 (Baker Island)</SelectItem>
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
      title: "How did you hear about Blightstone?",
      subtitle: "This helps us understand which channels work best so we can improve our service.",
      component: (
        <div className="space-y-4">
          <Select value={howHeardAboutUs} onValueChange={setHowHeardAboutUs}>
            <SelectTrigger className="h-12 bg-gray-900 border-gray-700 text-white rounded-md">
              <SelectValue placeholder="Select how you found us" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto bg-gray-900 border-gray-700 text-white">
              <SelectItem value="google" className="cursor-pointer hover:bg-gray-800 transition-colors">Google Search</SelectItem>
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

      // Create organization with collected information
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${orgName}'s Team`,
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

      toast.success("Welcome to Blightstone! Explore your dashboard and upgrade when ready.")
      router.push('/dashboard?welcome=true')
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error("Failed to complete setup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNextWithValidation = () => {
    if (currentQuestion.isValid()) {
      handleNext()
    } else {
      toast.error("Please fill out the field to continue")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-gray-800/20 via-transparent to-transparent rounded-full blur-3xl" />
      
      <div className="absolute top-6 left-6 z-10">
        <BlightstoneLogo size="sm" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-12">
            <div className="w-full bg-gray-700 h-1 rounded-full mb-2">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</p>
          </div>
          
          <div className="space-y-8 min-h-[240px] flex flex-col justify-center">
            <div className="text-center">
              {currentQuestion.title && (
                <h2 className="text-3xl font-bold mb-2">{currentQuestion.title}</h2>
              )}
              {currentQuestion.subtitle && (
                <p className="text-gray-400 max-w-xl mx-auto">{currentQuestion.subtitle}</p>
              )}
            </div>
            
            <div>
              {currentQuestion.component}
            </div>
          </div>
          
          <div className="mt-12 flex justify-between items-center">
            {currentStep > 1 && (
              <Button 
                onClick={handleBack}
                variant="ghost"
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
            )}
            <div /> {/* Spacer */}
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNextWithValidation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-semibold flex items-center gap-2"
              >
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-semibold"
              >
                {loading ? "Finalizing..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 