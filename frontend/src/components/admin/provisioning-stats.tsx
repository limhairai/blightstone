"use client";

import { useAppData } from "../../contexts/AppDataContext"
import { CreditCard, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";

export function ProvisioningStats() {
  const { state } = useAppData();
  
  // Calculate provisioning statistics using proper admin statuses
  const approvedBusinesses = state.businesses.filter(b => b.status === "approved").length;
  const totalAccounts = state.accounts.length;
  const activeAccounts = state.accounts.filter(acc => acc.status === "active").length;
  const pendingAccounts = state.accounts.filter(acc => acc.status === "pending").length;
  const totalSpend = state.accounts.reduce((total, account) => total + (account.spend || 0), 0);

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
      value: `$${(totalSpend / 1000).toFixed(1)}k`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

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