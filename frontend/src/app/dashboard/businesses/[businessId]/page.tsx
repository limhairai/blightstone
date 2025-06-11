"use client"

import { BusinessDetailView } from "@/components/businesses/business-detail-view"

interface BusinessDetailPageProps {
  params: {
    businessId: string
  }
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  return <BusinessDetailView businessId={params.businessId} />
} 