"use client"

import { LoginView } from "../../components/auth/login-view"

// Force dynamic rendering for authentication page
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return <LoginView />
} 