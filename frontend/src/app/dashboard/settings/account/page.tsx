import { AccountSettings } from "../../../../components/settings/account-settings"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

export default function AccountSettingsPage() {
  return <AccountSettings />
} 