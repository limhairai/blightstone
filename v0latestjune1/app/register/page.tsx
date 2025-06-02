import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Join <span className="fey-gradient">AdHub</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Create an account to access ad accounts on demand</p>
        </div>

        <div className="mt-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="Full name"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input id="terms" name="terms" type="checkbox" className="checkbox" />
              <Label htmlFor="terms" className="ml-2 block text-sm text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-white hover:text-white/90">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-white hover:text-white/90">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <div>
              <Button className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                Create account
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative px-4 text-sm bg-background text-muted-foreground">Or continue with</div>
            </div>

            <div>
              <Button variant="outline" className="w-full h-12 rounded-md border border-border bg-secondary/50">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign up with Google
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="fey-gradient font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
