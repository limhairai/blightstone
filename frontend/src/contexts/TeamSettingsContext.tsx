"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTeam } from './TeamContext';
import { useAuth } from './AuthContext';

interface TeamSettings {
  name: string;
  billingEmail: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
  };
  subscription: {
    plan: 'bronze' | 'silver' | 'gold' | 'platinum';
    billingPeriod: 'monthly' | 'annual';
    status: 'active' | 'inactive' | 'cancelled';
    nextBillingDate: Date;
  };
  balance: number;
  topUpFee: number;
  stripeCustomerId?: string;
}

interface TopUpCalculation {
  amount: number;
  fee: number;
  amountAfterFee: number;
  totalAmount: number;
}

interface TeamSettingsContextType {
  settings: TeamSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (settings: Partial<TeamSettings>) => Promise<void>;
  calculateTopUp: (amount: number) => TopUpCalculation;
  initiateTopUp: (amount: number) => Promise<{ clientSecret: string }>;
  updateSubscription: (plan: 'bronze' | 'silver' | 'gold' | 'platinum', billingPeriod: 'monthly' | 'annual') => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const TeamSettingsContext = createContext<TeamSettingsContextType | null>(null);

const TOP_UP_FEES = {
  bronze: 0.025,
  silver: 0.015,
  gold: 0.01,
  platinum: 0.005,
};

type PlanKey = keyof typeof TOP_UP_FEES;

export function TeamSettingsProvider({ children }: { children: ReactNode }) {
  const { currentTeam, hasPermission } = useTeam();
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Fetch team settings from backend
  useEffect(() => {
    if (!currentTeam) return;
    setLoading(true);
    fetch(`/api/v1/organizations/${currentTeam.id}/settings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adhub_token')}` },
    })
      .then((res) => res.json())
      .then((data: any) => {
        let planKey: PlanKey = 'bronze';
        const rawPlan = data.subscription?.plan;
        if (rawPlan && Object.prototype.hasOwnProperty.call(TOP_UP_FEES, rawPlan)) {
          planKey = rawPlan as PlanKey;
        }

        setSettings({
          name: data.name,
          billingEmail: data.billingEmail,
          notificationPreferences: data.notificationPreferences || { email: true, push: true },
          subscription: {
            plan: planKey,
            billingPeriod: data.subscription?.billingPeriod || 'monthly',
            status: data.subscription?.status || 'inactive',
            nextBillingDate: data.subscription?.nextBillingDate ? new Date(data.subscription.nextBillingDate) : new Date(),
          },
          balance: data.balance || 0,
          topUpFee: TOP_UP_FEES[planKey],
          stripeCustomerId: data.stripeCustomerId,
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [currentTeam]);

  const updateSettings = async (newSettings: Partial<TeamSettings>) => {
    if (!currentTeam || !hasPermission('manage_team_settings')) {
      throw new Error('Not authorized');
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adhub_token')}`,
        },
        body: JSON.stringify({ ...newSettings }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      setLoading(false);
      // Optionally, refetch settings
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const calculateTopUp = (amount: number): TopUpCalculation => {
    const topUpFee = TOP_UP_FEES[settings?.subscription.plan || 'bronze'];
    const fee = amount * topUpFee;
    const amountAfterFee = amount - fee;
    const totalAmount = amount;
    return {
      amount,
      fee,
      amountAfterFee,
      totalAmount,
    };
  };

  const initiateTopUp = async (amount: number): Promise<{ clientSecret: string }> => {
    if (!currentTeam || !hasPermission('top_up_balance')) {
      throw new Error('Not authorized to top up balance.');
    }
    if (!user) {
      throw new Error('User not authenticated. Cannot initiate top up.');
    }

    try {
      const calculation = calculateTopUp(amount);
      const token = await user.getIdToken(true);
      const response = await fetch('/api/proxy/v1/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId: currentTeam.id,
          amount: calculation.totalAmount,
          metadata: {
            amountAfterFee: calculation.amountAfterFee,
            fee: calculation.fee,
            type: 'top_up',
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      const { clientSecret } = await response.json();
      return { clientSecret };
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateSubscription = async (
    plan: 'bronze' | 'silver' | 'gold' | 'platinum',
    billingPeriod: 'monthly' | 'annual'
  ) => {
    if (!currentTeam || !hasPermission('manage_subscription')) {
      throw new Error('Not authorized');
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adhub_token')}`,
        },
        body: JSON.stringify({
          plan,
          billingPeriod,
          status: 'active',
          nextBillingDate: new Date(Date.now() + (billingPeriod === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
          topUpFee: TOP_UP_FEES[plan],
        }),
      });
      if (!res.ok) throw new Error('Failed to update subscription');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!currentTeam || !hasPermission('manage_subscription')) {
      throw new Error('Not authorized');
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adhub_token')}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel subscription');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    calculateTopUp,
    initiateTopUp,
    updateSubscription,
    cancelSubscription,
  };

  return <TeamSettingsContext.Provider value={value}>{children}</TeamSettingsContext.Provider>;
}

export function useTeamSettings() {
  const context = useContext(TeamSettingsContext);
  if (!context) {
    throw new Error('useTeamSettings must be used within a TeamSettingsProvider');
  }
  return context;
} 