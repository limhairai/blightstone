import { TeamSettings } from "../../../../components/settings/team-settings"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

export default function TeamSettingsPage() {
  return <TeamSettings />
} 