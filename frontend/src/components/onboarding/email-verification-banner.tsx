import { Button } from "../ui/button"

interface EmailVerificationBannerProps {
  onResendEmail?: () => void
}

export function EmailVerificationBanner({ onResendEmail }: EmailVerificationBannerProps) {
  return (
    <div className="mb-4 p-4 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 text-red-400 flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-red-300">Verify your email address</div>
          <div className="text-sm text-red-400/80">
            Please check your email and click the verification link to activate your Blightstone account.
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onResendEmail}
        className="border-red-500/30 text-red-300 hover:bg-red-600/10 hover:border-red-500/50"
      >
        Resend Email
      </Button>
    </div>
  )
} 