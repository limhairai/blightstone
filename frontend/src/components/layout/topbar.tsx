"use client"

import { Button } from "../ui/button"
import { LogOut } from "lucide-react"
import { usePageTitle } from "../core/simple-providers"
import { useAuth } from "../../contexts/AuthContext"

interface TopbarProps {
  // Simplified props - no admin or profile dropdown needed
}

export function Topbar(props: TopbarProps = {}) {
  const { pageTitle } = usePageTitle()
  const { signOut } = useAuth()

  return (
    <div className="sticky top-0 z-50 h-16 border-b border-border/20 flex items-center justify-between px-3 md:px-4 bg-card/80 backdrop-blur-md">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3 ml-4">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      {/* Right: Simple Logout Button */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={signOut}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}