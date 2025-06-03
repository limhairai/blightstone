import { Logo } from "@/components/core/Logo"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col md:flex-row items-center md:items-start justify-between py-8 gap-4">
        <div>
          <Logo linkWrapper={false} />
        </div>

        <div className="flex gap-8">
          <Link href="/terms" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/support" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
            Support
          </Link>
        </div>

        <div className="text-sm text-foreground/60">© {new Date().getFullYear()} AdHub. All rights reserved.</div>
      </div>
    </footer>
  )
} 