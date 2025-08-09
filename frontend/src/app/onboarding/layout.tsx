import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Your Setup - Blightstone',
  description: 'Complete your Blightstone setup to start managing your Facebook advertising accounts',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 