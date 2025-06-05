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
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { OnboardingProvider } from "@/contexts/onboarding-context";
// import { ImpersonationProvider } from "@/contexts/ImpersonationContext";

// Define the queryClient
const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <OrganizationProvider>
              <AuthProvider>
                <UserProvider>
                  <NotificationProvider>
                    <OnboardingProvider>
                      {/* <ImpersonationProvider> */}
                        <TeamProvider>
                          <TeamSettingsProvider>
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
                          </TeamSettingsProvider>
                        </TeamProvider>
                        <ReactQueryDevtools initialIsOpen={false} />
                      {/* </ImpersonationProvider> */}
                    </OnboardingProvider>
                  </NotificationProvider>
                </UserProvider>
              </AuthProvider>
            </OrganizationProvider>
          </QueryClientProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
} 