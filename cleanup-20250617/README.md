# Onboarding Components

This directory contains components related to user onboarding and setup guidance.

## Components

### SetupGuideWidget

A floating widget that guides users through the initial setup process with real-time progress tracking.

**Features:**
- Three states: `expanded`, `collapsed`, `closed`
- Dynamic progress tracking based on actual user data
- Collapsible sections for each setup step
- Visual progress indicators and completion status
- Fixed positioning (bottom-right corner)

**Usage:**
```tsx
import { SetupGuideWidget } from '@/components/onboarding/setup-guide-widget'

<SetupGuideWidget 
  widgetState={widgetState} 
  onStateChange={setWidgetState}
  setupProgress={setupProgress}
/>
```

### EmailVerificationBanner

A banner that prompts users to verify their email address.

**Features:**
- Red alert styling to draw attention
- Resend email functionality
- Shows only when email is not verified

**Usage:**
```tsx
import { EmailVerificationBanner } from '@/components/onboarding/email-verification-banner'

<EmailVerificationBanner onResendEmail={handleResendEmail} />
```

## Setup Progress System

The onboarding system uses a sophisticated progress tracking system that monitors actual user data:

### Setup Steps Tracked:
1. **Email Verification** - `user.email_confirmed_at` exists
2. **Wallet Funding** - User has balance > 0
3. **Business Setup** - User has created organizations/businesses
4. **Ad Account Setup** - User has created ad accounts

### When Onboarding Elements Show:
- **Setup Widget**: Shows when any required step is incomplete
- **Email Banner**: Shows specifically when email is not verified
- **Topbar Button**: Shows when widget is closed AND user needs onboarding

### Progress Calculation:
```tsx
import { getSetupProgress, shouldShowOnboarding, calculateSetupCompletion } from '@/lib/state-utils'

const progress = getSetupProgress(
  emailVerified,
  hasBalance,
  hasBusinesses,
  hasAccounts
)

const shouldShow = shouldShowOnboarding(progress) // Returns true if incomplete
const completion = calculateSetupCompletion(progress) // Returns percentage, steps, etc.
```

### Automatic Completion:
The setup widget automatically disappears when all required steps are completed:
- ✅ Email verified
- ✅ Wallet has funds
- ✅ Business created
- ✅ Ad account created

## Hooks

### useSetupProgress

A custom hook that provides real-time setup progress data:

```tsx
import { useSetupProgress } from '@/hooks/useSetupProgress'

const setupProgress = useSetupProgress()
// Returns SetupProgress object with current completion status
```

## Context Integration

The setup widget state is managed globally through `AppShell` context:

```tsx
import { useSetupWidget } from '@/components/layout/app-shell'

const { 
  setupWidgetState, 
  setSetupWidgetState,
  showEmptyStateElements,
  setShowEmptyStateElements 
} = useSetupWidget()
```

## Smart Visibility

The system intelligently shows/hides onboarding elements:

- **New Users**: See full onboarding experience
- **Partially Complete**: See remaining steps only
- **Complete Users**: No onboarding elements shown
- **Global Access**: Widget available on all pages when needed
- **Contextual**: Email banner shows independently of other progress

This creates a seamless onboarding experience that adapts to each user's current progress and disappears when no longer needed. 