"use client"

import { LoginView } from "../../components/auth/login-view"
import { ToastTest } from "../../components/debug/toast-test"

// Force dynamic rendering for authentication page
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <>
      <LoginView />
      <ToastTest />
    </>
  )
} 