"use client"

import { MagicLinkView } from "@/components/auth/magic-link-view"

// Force dynamic rendering for authentication page
export const dynamic = 'force-dynamic'

export default function MagicLinkPage() {
  console.log('🔗 MagicLinkPage rendering');
  return <MagicLinkView />
} 