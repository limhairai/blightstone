"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Building2, Globe, DollarSign, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { toast } from "sonner"

interface BusinessApplicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BusinessApplicationForm({ open, onOpenChange, onSuccess }: BusinessApplicationFormProps) {
  const { user, session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    businessName: '',
    website: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    console.log("Form data at submission:", formData);
    
    try {
      // First, get user's organizations to find the organization ID
      const orgsResponse = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!orgsResponse.ok) {
        throw new Error('Failed to fetch organizations');
      }
      
      const orgsData = await orgsResponse.json();
      const userOrganizations = orgsData.organizations || orgsData;
      
      if (!userOrganizations || userOrganizations.length === 0) {
        throw new Error('No organization found. Please contact support.');
      }
      
      // Use the first organization (users typically have one organization)
      const organizationId = userOrganizations[0].id;
      console.log("Found organizationId:", organizationId);

      const payload = {
        name: formData.businessName,
        website: formData.website,
        organization_id: organizationId,
        country: null, // Can be added to form later if needed
        landing_page: formData.description, // Store description as landing page info
      };

      console.log("Sending payload to /api/businesses:", payload);
      
      const response = await fetch(`/api/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }

      const result = await response.json()
      
      toast.success('Business application submitted successfully!')
      onSuccess?.()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        businessName: '',
        website: '',
        description: ''
      })
      setCurrentStep(1)
      
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.businessName
      case 2:
        return formData.website
      case 3:
        return formData.description
      default:
        return false
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Business Information</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          placeholder="The business you want to advertise"
          className="bg-background"
        />
      </div>


    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Business Details</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website URL *</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://your-business-website.com"
          className="bg-background"
        />
        <p className="text-sm text-muted-foreground">
          We'll review your website to ensure it complies with our advertising policies.
        </p>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Business Description</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Tell us about your business *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your business, products, or services. What do you sell? Who are your customers? This helps us verify your business complies with advertising policies."
          rows={6}
          className="bg-background"
        />
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Ready to Submit</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your business application will be reviewed by our team within 24-48 hours. 
                Once approved, you'll be able to apply for ad accounts for this business.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
            }
          `}>
            {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          {step < 3 && (
            <div className={`
              w-12 h-0.5 mx-2
              ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Business Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-end space-x-2 mt-6">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext} disabled={!isStepValid(currentStep)}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !isStepValid(currentStep)}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
