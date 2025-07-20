"use client"

import { ResetPasswordView } from "@/components/auth/reset-password-view"

// Force dynamic rendering for authentication page
export const dynamic = 'force-dynamic'

export default function UpdatePasswordPage() {
  return <ResetPasswordView />
} 