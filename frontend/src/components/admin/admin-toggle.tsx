"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { setCookie, getCookie } from "cookies-next"

export function AdminToggle() {
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if admin cookie exists
    const adminCookie = getCookie("isAdmin")
    setIsAdmin(adminCookie === "true")
  }, [])

  const toggleAdmin = () => {
    const newValue = !isAdmin
    setIsAdmin(newValue)
    setCookie("isAdmin", newValue ? "true" : "false", { 
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    } as any)

    // Redirect to appropriate dashboard
    if (newValue) {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <Button
      onClick={toggleAdmin}
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-50 bg-black/80 text-white border-gray-700 hover:bg-black/60"
    >
      <ShieldCheck className="mr-2 h-4 w-4" />
      {isAdmin ? "Exit Admin Mode" : "Enter Admin Mode"}
    </Button>
  )
}
