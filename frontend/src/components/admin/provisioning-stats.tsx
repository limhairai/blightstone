"use client";

import useSWR from 'swr'
import { CreditCard, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ProvisioningStats() {
  const { data: bizData, isLoading: isBizLoading } = useSWR('/api/businesses', fetcher);
  const { data: accData, isLoading: isAccLoading } = useSWR('/api/ad-accounts', fetcher);

  const businesses = bizData?.businesses || [];
  const accounts = accData?.accounts || [];

  const isLoading = isBizLoading || isAccLoading;
  
  // Calculate provisioning statistics using proper admin statuses
  const approvedBusinesses = businesses.filter((b: any) => b.status === "approved" || b.status === "active").length;
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((acc: any) => acc.status === "active").length;
  const pendingAccounts = accounts.filter((acc: any) => acc.status === "pending").length;
  const totalSpend = accounts.reduce((total: any, account: any) => total + (account.spent || 0), 0);

  const stats = [
    {
      label: "Approved Businesses",
      value: approvedBusinesses,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Ad Accounts",
      value: totalAccounts,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Active Accounts",
      value: activeAccounts,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending Setup",
      value: pendingAccounts,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Total Spend",
      value: `${(totalSpend / 1000).toFixed(1)}k`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-6 w-3/4 rounded-md bg-muted mb-2"></div>
            <div className="h-8 w-1/2 rounded-md bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 