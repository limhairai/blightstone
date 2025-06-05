"use client"

import { useState } from "react"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { OrganizationForm } from "@/components/onboarding/organization-form"
import { AdSpendForm } from "@/components/onboarding/ad-spend-form"
import { SupportChannelSetup } from "@/components/onboarding/support-channel-setup"
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete"
import { useRouter } from "next/navigation"
import { useOrganization, Organization } from "@/contexts/organization-context";
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { AdHubLogo } from "@/components/core/AdHubLogo"
import { useAuth } from '@/contexts/AuthContext'
import { Loader } from "@/components/core/Loader"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { useOnboarding } from "@/contexts/onboarding-context"

// Define a local Organization type for this page,
// matching the expected structure that setCurrentOrg from OrganizationContext expects.
// This type might be redundant if Organization from context is used directly.
interface OnboardingPageOrganization {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    planId?: string;
}

// Define types for formData sections for better type safety in updateFormData
type OrganizationFormData = { name: string };
type ProjectFormData = { name: string; domains: string[]; websiteUrl: string };
type AdSpendFormData = { monthly: string; platforms: string[] }; // Assuming platforms is string[]
type SupportChannelFormData = { type: string; email: string; handle: string };

type FormDataSectionData = OrganizationFormData | ProjectFormData | AdSpendFormData | SupportChannelFormData;

// Helper function to check for 'detail' property in error objects
interface ErrorWithDetail extends Error {
  detail?: string;
}

// Type guard to check if error has a 'detail' property
function hasDetail(error: unknown): error is ErrorWithDetail {
  return typeof error === 'object' && error !== null && 'detail' in error;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, session } = useAuth(); // Get user and session from AuthContext
  const { organizations, currentOrg, setCurrentOrg, loading: orgLoading, error: orgError, mutate: mutateOrganizationsHook } = useOrganization(); // Get organization related state from OrganizationContext
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    organization: {
      name: "",
    },
    project: {
      name: "",
      domains: [""],
      websiteUrl: ""
    },
    adSpend: {
      monthly: "",
      platforms: [],
    },
    supportChannel: {
      type: "slack",
      email: "",
      handle: "",
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  console.log("[OnboardingPage] Rendering - Step:", step, "orgLoading:", orgLoading, "orgError:", orgError, "User:", !!user);
  console.log("[OnboardingPage] Organizations from context:", organizations);
  console.log("[OnboardingPage] CurrentOrg from context:", currentOrg);

  const totalSteps = 3;
  const displayStep = Math.min(step, totalSteps);

  const updateFormData = (section: string, data: Partial<FormDataSectionData>) => {
    setFormData((prev) => ({
      ...prev,
      [section as keyof typeof prev]: {
        ...prev[section as keyof typeof prev],
        ...data,
      },
    }))
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    if (!user) {
      setError("User not authenticated. Please log in and try again.")
      setLoading(false)
      toast({ title: "Authentication Error", description: "User not authenticated.", variant: "destructive" })
      return
    }

    const token = session?.access_token;

    if (!token) {
      console.error("Onboarding handleSubmit: No access token found in Supabase session.");
      setError("Could not verify user session. Please try again.");
      setLoading(false);
      toast({ title: "Session Error", description: "Could not verify user session. Please try again.", variant: "destructive" });
      return;
    }

    try {
      console.log('[Onboarding] Submitting org creation with token for user:', user.id, formData)
      // 1. Create organization
      const orgRes = await fetch('/api/proxy/v1/organizations', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.organization.name,
          adSpend: formData.adSpend,
          supportChannel: formData.supportChannel,
        }),
      })
      const orgData = await orgRes.json()
      if (!orgRes.ok) {
        if (orgData.detail === "You already have an organization associated with your account.") {
          setError("You already have an organization. If you need to create another, please contact support.");
        } else {
          setError(orgData.detail || "Onboarding failed due to an unknown reason from the server.");
        }
        setLoading(false)
        return
      }

      // orgData should contain the newly created organization with its ID
      // Ensure your backend returns the full org object including the id
      const newOrg = orgData; // orgData is the response from organization creation
      if (!newOrg || !newOrg.id) {
          setError("Organization created, but backend did not return valid organization data. Please refresh.");
          setLoading(false);
          return;
      }
      const orgId = newOrg.id;
      console.log("[Onboarding] New Org ID from backend response:", orgId, "Full new org data:", newOrg);

      // 3. Create the first project for this org (using newOrg.id)
      const projectRes = await fetch(`/api/proxy/v1/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.project.name,
          domains: formData.project.domains,
          websiteUrl: formData.project.websiteUrl,
          orgId, // Use the orgId from the newOrg
        }),
      })
      const projectData = await projectRes.json()
      if (!projectRes.ok) {
        setError(projectData.detail || "Project creation failed for new org. Please try again.")
        setLoading(false)
        return
      }
      console.log("[Onboarding] Project created successfully for new org:", projectData);

      // 4. Update context and localStorage with the *newly created* organization
      // Instead of re-fetching all orgs, we can add the new one to the existing list (if available)
      // or just set the new one as current and let SWR revalidate the full list later if needed.
      
      // Update OrganizationContext
      if (setCurrentOrg) {
          const orgForContext: OnboardingPageOrganization = {
              id: newOrg.id,
              name: newOrg.name,
              avatar: newOrg.avatar || undefined,
              role: newOrg.role || "owner",
              planId: newOrg.planId || "bronze"
          };
          // Attempt to use the imported Organization type for setCurrentOrg if compatible
          // or ensure OnboardingPageOrganization matches what setCurrentOrg expects.
          setCurrentOrg(orgForContext as Organization);
          console.log("[Onboarding] Set currentOrg to newly created org:", orgForContext);
          if (mutateOrganizationsHook) {
            mutateOrganizationsHook();
            console.log("[Onboarding] Called mutate (from useOrganization) for SWR revalidation.");
          }
      }
      
      router.push('/dashboard');
      toast({ title: "Onboarding complete!", description: "Your organization and project have been created.", variant: "default" });
    } catch (error: unknown) {
      console.error("Onboarding handleSubmit: CATCH BLOCK error object:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for detail if it's our custom error structure from backend
        if (hasDetail(error) && error.detail) { // Check error.detail for truthiness too
            errorMessage += `: ${error.detail}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
      toast({ title: "Onboarding Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (orgLoading && !organizations) { 
    console.log("[OnboardingPage] orgLoading is true AND no organizations yet (or undefined), rendering Loader.");
    return <Loader fullScreen />;
  }

  if (orgError) {
    console.log("[OnboardingPage] orgError is true, rendering error message:", orgError);
    let displayError = "Unknown error loading organization data.";
    if (typeof orgError === 'string') {
        displayError = orgError;
    } else if (orgError instanceof Error) {
        displayError = orgError.message;
    } else if (typeof orgError === 'object' && orgError !== null && 'message' in orgError && typeof (orgError as { message: unknown }).message === 'string') {
        displayError = (orgError as { message: string }).message;
    }
    return <div className="flex min-h-screen items-center justify-center text-red-500 p-4">Error: {displayError}</div>;
  }

  return (
    <>
      <OnboardingLayout currentStep={displayStep} totalSteps={totalSteps}>
        <div className="px-6 py-4 md:px-8">
          <Link href={user ? "/dashboard" : "/"}>
            <AdHubLogo size="lg" />
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <>
            {step === 1 && (
              <OrganizationForm
                data={formData.organization}
                projectData={formData.project}
                updateData={(data) => updateFormData("organization", data)}
                updateProjectData={(data) => updateFormData("project", data)}
                onNext={nextStep}
                loading={loading}
              />
            )}

            {step === 2 && (
              <AdSpendForm
                data={formData.adSpend}
                updateData={(data) => updateFormData("adSpend", data)}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {step === 3 && (
              <SupportChannelSetup
                data={formData.supportChannel}
                updateData={(data) => updateFormData("supportChannel", data)}
                onSubmit={handleSubmit}
                onBack={prevStep}
                loading={loading}
                disabled={loading}
              />
            )}

            {step === 4 && <OnboardingComplete organizationName={formData.organization.name} redirectTo="/dashboard" />}

            {error && (
              <div className="text-red-500 text-sm text-center mt-4">
                {/* Simplified error display to use the processed errorMessage string */} 
                {error} 
              </div>
            )}
          </>
        )}
      </OnboardingLayout>
    </>
  )
} 