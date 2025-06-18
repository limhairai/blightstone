"use client"

import { LandingView } from "../components/landing/landing-view"

// Force dynamic rendering since this page uses authentication context
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return <LandingView />
} 