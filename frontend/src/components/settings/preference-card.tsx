import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Mail, Keyboard, CreditCard } from "lucide-react"

interface PreferenceItemProps {
  icon?: ReactNode
  title: string
  description: string
  children?: ReactNode
}

function PreferenceItem({ icon, title, description, children }: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

export function PreferencesCard() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <PreferenceItem
          icon={<Heart size={16} />}
          title="Communications"
          description="Manage your email newsletter, get help, or join our Slack."
        />
        <PreferenceItem
          icon={<Mail size={16} />}
          title="Email Notifications"
          description="Receive updates about account activity and news."
        />
        <PreferenceItem
          icon={<Keyboard size={16} />}
          title="Keyboard Shortcuts"
          description="Press ? anytime for a cheat sheet."
        />
        <PreferenceItem
          icon={<CreditCard size={16} />}
          title="Payment Method"
          description="Manage your payment methods and billing information."
        />
      </CardContent>
    </Card>
  )
}
