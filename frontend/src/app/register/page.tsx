"use client"

import { RegisterView } from "../../components/auth/register-view"

// Force dynamic rendering for authentication page
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return <RegisterView />
} 