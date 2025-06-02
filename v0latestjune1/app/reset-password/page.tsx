import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            New <span className="fey-gradient">Password</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Create a new password for your account</p>
        </div>

        <div className="mt-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="New password"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className="h-12 bg-secondary/50 border-0 rounded-md px-5 text-sm"
                />
              </div>
            </div>

            <div>
              <Button className="w-full h-12 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                Reset password
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
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
