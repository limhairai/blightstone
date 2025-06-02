import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"

export function MainNav() {
  return (
    <nav className="border-b border-[#222] py-4">
      <div className="container max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-12">
          <Logo />
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-white/80 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-white/80 hover:text-white transition-colors">
              Help Center
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-white/80 hover:text-white transition-colors">
            Login
          </Link>
          <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
            Sign Up Free
          </Button>
        </div>
      </div>
    </nav>
  )
}
