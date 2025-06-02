import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/user-context";
import { OrganizationProvider } from "@/contexts/organization-context";
import { TeamProvider } from "@/contexts/TeamContext";
import { TeamSettingsProvider } from "@/contexts/TeamSettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { AdAccountProvider } from "@/contexts/AdAccountContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { BillingProvider } from "@/contexts/BillingContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <UserProvider>
          <OrganizationProvider>
            <TeamProvider>
              <TeamSettingsProvider>
                <NotificationProvider>
                  <AnalyticsProvider>
                    <AdAccountProvider>
                      <ProjectProvider>
                        <BillingProvider>
                          <SettingsProvider>
                            {children}
                          </SettingsProvider>
                        </BillingProvider>
                      </ProjectProvider>
                    </AdAccountProvider>
                  </AnalyticsProvider>
                </NotificationProvider>
              </TeamSettingsProvider>
            </TeamProvider>
          </OrganizationProvider>
        </UserProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
} 