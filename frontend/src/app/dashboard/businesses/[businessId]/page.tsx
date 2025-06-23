"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { BusinessDetailView } from "../../../../components/businesses/business-detail-view"

interface BusinessDetailPageProps {
  params: {
    businessId: string
  }
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  return <BusinessDetailView businessId={params.businessId} />
} 