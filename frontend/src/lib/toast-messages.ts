// Comprehensive toast message system for AdHub
import { toast } from "sonner"

// Toast types and configurations
export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastConfig {
  title?: string
  description: string
  duration?: number
}

// Authentication Messages
export const authMessages = {
  signIn: {
    success: { description: "Welcome back! You've been signed in successfully." },
    loading: { description: "Signing you in..." },
    invalidCredentials: { description: "Incorrect email or password. Please check your credentials and try again." },
    emailNotConfirmed: { description: "Your email address hasn't been confirmed yet. Please check your email and click the confirmation link." },
    tooManyRequests: { description: "Too many login attempts. Please wait a moment and try again." },
    userNotFound: { description: "No account found with this email address." },
    invalidApiKey: { description: "Authentication service unavailable. Please try again later." },
    networkError: { description: "Network error. Please check your connection and try again." },
    unknown: { description: "An unexpected error occurred. Please try again." }
  },
  signUp: {
    success: { 
      description: "Registration successful! Please check your email to confirm your account.",
      duration: 10000 
    },
    accountExists: { 
      description: "An account with this email already exists. Redirecting to login...",
      duration: 3000 
    },
    weakPassword: { description: "Password is too weak. Please use at least 8 characters with numbers and symbols." },
    invalidEmail: { description: "Please enter a valid email address." },
    unknown: { description: "Registration failed. Please try again." }
  },
  signOut: {
    success: { description: "You've been signed out successfully." },
    inactivity: { 
      description: "You have been logged out after 30 minutes of inactivity.",
      duration: 5000 
    },
    error: { description: "Error signing out. Please try again." }
  },
  passwordReset: {
    success: { 
      description: "If an account exists for this email, a password reset link has been sent. Please check your inbox.",
      duration: 10000 
    },
    error: { description: "Failed to send password reset email. Please try again." }
  }
}

// Business & Account Management Messages
export const businessMessages = {
  create: {
    success: { description: "Business created successfully!" },
    error: { description: "Failed to create business. Please try again." },
    nameRequired: { description: "Business name is required." }
  },
  update: {
    success: { description: "Business updated successfully!" },
    error: { description: "Failed to update business. Please try again." }
  },
  delete: {
    success: { description: "Business deleted successfully." },
    error: { description: "Failed to delete business. Please try again." },
    confirmation: { description: "Please type the business name correctly to confirm deletion." }
  },
  approve: {
    success: { description: "Business approved successfully!" },
    error: { description: "Failed to approve business. Please try again." }
  }
}

export const accountMessages = {
  create: {
    success: { description: "Ad account created successfully!" },
    error: { description: "Failed to create ad account. Please try again." },
    nameRequired: { description: "Please enter an account name." },
    businessRequired: { description: "Please select a business." }
  },
  update: {
    success: { description: "Account updated successfully!" },
    error: { description: "Failed to update account. Please try again." }
  },
  delete: {
    success: { description: "Account deleted successfully." },
    error: { description: "Failed to delete account. Please try again." }
  },
  pause: {
    success: { description: "Account paused successfully." },
    bulk: (count: number) => ({ description: `Paused ${count} account(s) successfully.` }),
    error: { description: "Failed to pause account(s). Please try again." }
  },
  resume: {
    success: { description: "Account resumed successfully." },
    bulk: (count: number) => ({ description: `Resumed ${count} account(s) successfully.` }),
    error: { description: "Failed to resume account(s). Please try again." }
  }
}

// Financial Messages
export const walletMessages = {
  addFunds: {
    success: (amount: number) => ({ 
      description: `Successfully added $${amount.toLocaleString()} to your wallet.` 
    }),
    error: { description: "Failed to add funds. Please try again." },
    invalidAmount: { description: "Please enter a valid amount greater than $0." },
    insufficientBalance: { description: "Amount exceeds your available balance." }
  },
  withdraw: {
    success: (amount: number) => ({ 
      description: `Successfully withdrew $${amount.toLocaleString()} from your wallet.` 
    }),
    error: { description: "Failed to withdraw funds. Please try again." },
    insufficientFunds: { description: "Insufficient funds for withdrawal." }
  },
  topUp: {
    success: (account: string, amount: number) => ({ 
      description: `Successfully topped up ${account} with $${amount.toLocaleString()}.` 
    }),
    error: { description: "Failed to process top up. Please try again." },
    insufficientWallet: { description: "Insufficient wallet balance for top-up." }
  },
  consolidate: {
    success: (amount: number) => ({ 
      description: `Successfully consolidated $${amount.toLocaleString()}.` 
    }),
    error: { description: "Failed to consolidate funds. Please try again." },
    insufficientFunds: { description: "Insufficient funds to consolidate." }
  },
  distribute: {
    success: (amount: number, count: number) => ({ 
      description: `Successfully distributed $${amount.toLocaleString()} across ${count} accounts.` 
    }),
    error: { description: "Failed to distribute funds. Please try again." },
    insufficientFunds: { description: "Insufficient funds to distribute." }
  }
}

// Team Management Messages
export const teamMessages = {
  invite: {
    success: (email: string) => ({ description: `Successfully invited team member: ${email}` }),
    error: { description: "Failed to send invitation. Please try again." },
    emailRequired: { description: "Please enter an email address." },
    alreadyExists: { description: "A team member with this email already exists." }
  },
  update: {
    success: { description: "Team member updated successfully!" },
    error: { description: "Failed to update team member. Please try again." }
  },
  remove: {
    success: { description: "Team member removed successfully." },
    error: { description: "Failed to remove team member. Please try again." }
  },
  roleChange: {
    success: (role: string) => ({ description: `Successfully changed role to ${role}.` }),
    error: { description: "Failed to change role. Please try again." }
  },
  resendInvite: {
    success: (email: string) => ({ description: `Invitation resent to ${email}.` }),
    error: { description: "Failed to resend invitation. Please try again." }
  }
}

// System Messages
export const systemMessages = {
  copy: {
    success: { description: "Copied to clipboard!" },
    error: { description: "Failed to copy to clipboard." }
  },
  save: {
    success: { description: "Settings saved successfully!" },
    error: { description: "Failed to save settings. Please try again." }
  },
  export: {
    success: (count: number) => ({ description: `Exporting ${count} transactions...` }),
    complete: { description: "Data exported successfully!" },
    error: { description: "Failed to export data. Please try again." }
  },
  demo: {
    dataReset: { description: "Demo data has been reset successfully." },
    modeRestriction: { description: "This feature is not available in demo mode." }
  },
  upgrade: {
    success: (plan: string) => ({ description: `Upgrading to ${plan} plan...` }),
    redirect: { description: "Redirecting to secure payment form..." }
  }
}

// Helper functions for showing toasts
export const showToast = {
  success: (config: ToastConfig) => {
    toast.success(config.description, {
      description: config.title,
      duration: config.duration || 4000
    })
  },
  
  error: (config: ToastConfig) => {
    toast.error(config.description, {
      description: config.title,
      duration: config.duration || 5000
    })
  },
  
  info: (config: ToastConfig) => {
    toast.info(config.description, {
      description: config.title,
      duration: config.duration || 4000
    })
  },
  
  loading: (config: ToastConfig) => {
    return toast.loading(config.description, {
      description: config.title
    })
  }
}

// Quick access functions for common scenarios
export const quickToast = {
  authSuccess: () => showToast.success(authMessages.signIn.success),
  authError: (error?: string) => {
    if (error?.toLowerCase().includes('invalid api key') || error?.toLowerCase().includes('api key')) {
      showToast.error(authMessages.signIn.invalidApiKey)
    } else if (error?.toLowerCase().includes('credentials')) {
      showToast.error(authMessages.signIn.invalidCredentials)
    } else if (error?.toLowerCase().includes('email not confirmed')) {
      showToast.error(authMessages.signIn.emailNotConfirmed)
    } else if (error?.toLowerCase().includes('too many')) {
      showToast.error(authMessages.signIn.tooManyRequests)
    } else if (error?.toLowerCase().includes('user not found')) {
      showToast.error(authMessages.signIn.userNotFound)
    } else {
      showToast.error({ description: error || authMessages.signIn.unknown.description })
    }
  },
  
  copySuccess: () => showToast.success(systemMessages.copy.success),
  saveSuccess: () => showToast.success(systemMessages.save.success),
  
  // Function helpers for dynamic messages
  walletAdd: (amount: number) => showToast.success(walletMessages.addFunds.success(amount)),
  accountPaused: (count: number) => showToast.success(accountMessages.pause.bulk(count)),
  teamInvited: (email: string) => showToast.success(teamMessages.invite.success(email))
} 