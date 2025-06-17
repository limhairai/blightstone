"use client";

import { useDemoState } from "../../contexts/DemoStateContext";
import { Clock, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";

export function ApplicationsStats() {
  const { state } = useDemoState();
  
  // Calculate application statistics
  const totalApplications = state.businesses.length;
  const pendingApplications = state.businesses.filter(b => b.status === "pending").length;
  const approvedApplications = state.businesses.filter(b => b.status === "active").length;
  const rejectedApplications = state.businesses.filter(b => b.status === "rejected").length;
  const underReviewApplications = state.businesses.filter(b => b.status === "under_review").length;

  const stats = [
    {
      label: "Total Applications",
      value: totalApplications,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending Review",
      value: pendingApplications,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Under Review",
      value: underReviewApplications,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Approved",
      value: approvedApplications,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Rejected",
      value: rejectedApplications,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
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