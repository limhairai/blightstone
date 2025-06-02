"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"

interface OrganizationFormProps {
  data: {
    name: string
  }
  projectData: {
    name: string
    domains: string[]
    websiteUrl: string
  }
  updateData: (data: Partial<OrganizationFormProps["data"]>) => void
  updateProjectData: (data: Partial<OrganizationFormProps["projectData"]>) => void
  onNext: () => void
  loading?: boolean
}

export function OrganizationForm({ data, projectData, updateData, updateProjectData, onNext, loading = false }: OrganizationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!data.name.trim()) {
      newErrors.name = "Organization name is required"
    }
    if (!projectData.name.trim()) {
      newErrors.projectName = "Project name is required"
    }
    if (!projectData.domains.length || projectData.domains.some((d) => !d.trim())) {
      newErrors.domains = "At least one valid domain is required"
    }
    if (!projectData.websiteUrl || !projectData.websiteUrl.trim()) {
      newErrors.websiteUrl = "Website URL is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        onNext()
        setIsSubmitting(false)
      }, 500)
    }
  }

  const handleDomainChange = (idx: number, value: string) => {
    const newDomains = [...projectData.domains]
    newDomains[idx] = value
    updateProjectData({ domains: newDomains })
  }

  const handleAddDomain = () => {
    updateProjectData({ domains: [...projectData.domains, ""] })
  }

  const handleRemoveDomain = (idx: number) => {
    const newDomains = projectData.domains.filter((_, i) => i !== idx)
    updateProjectData({ domains: newDomains })
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="space-y-2 text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Tell us about your organization</h1>
        <p className="text-xs sm:text-sm text-[#71717a]">This information helps us customize your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            placeholder="Acme Inc."
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            placeholder="My E-Commerce Store"
            value={projectData.name}
            onChange={(e) => updateProjectData({ name: e.target.value })}
            className={errors.projectName ? "border-red-500" : ""}
          />
          {errors.projectName && <p className="text-sm text-red-500">{errors.projectName}</p>}
        </div>

        <div className="space-y-2">
          <Label>Project domains</Label>
          {projectData.domains.map((domain, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input
                placeholder="e.g. store.com"
                value={domain}
                onChange={(e) => handleDomainChange(idx, e.target.value)}
                className={errors.domains && !domain.trim() ? "border-red-500" : ""}
              />
              {projectData.domains.length > 1 && (
                <Button type="button" variant="outline" onClick={() => handleRemoveDomain(idx)} disabled={isSubmitting || loading}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={handleAddDomain} disabled={isSubmitting || loading}>
            + Add another domain
          </Button>
          {errors.domains && <p className="text-sm text-red-500">{errors.domains}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            placeholder="https://example.com"
            value={projectData.websiteUrl}
            onChange={(e) => updateProjectData({ websiteUrl: e.target.value })}
            className={errors.websiteUrl ? "border-red-500" : ""}
          />
          {errors.websiteUrl && <p className="text-sm text-red-500">{errors.websiteUrl}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black"
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
