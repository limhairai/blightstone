"use client";

import useSWR from 'swr'
import { Clock, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ApplicationsStats() {
  const { data: bizData, isLoading } = useSWR('/api/businesses', fetcher);

  const businesses = bizData?.businesses || [];
  
  // Calculate application statistics using proper admin statuses
  const totalApplications = businesses.length;
  const pendingApplications = businesses.filter((b: any) => b.status === "pending").length;
  const approvedApplications = businesses.filter((b: any) => b.status === "approved" || b.status === "active").length;
  const rejectedApplications = businesses.filter((b: any) => b.status === "rejected").length;
  const underReviewApplications = businesses.filter((b: any) => b.status === "under_review").length;

  const stats = [
    {
      label: "Total Applications",
      value: totalApplications,
      icon: FileText,
      color: "text-foreground",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending Review",
      value: pendingApplications,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Under Review",
      value: underReviewApplications,
      icon: AlertTriangle,
      color: "text-muted-foreground",
      bgColor: "bg-orange-50",
    },
    {
      label: "Approved",
      value: approvedApplications,
      icon: CheckCircle,
      color: "text-[#34D197]",
      bgColor: "bg-green-50",
    },
    {
      label: "Rejected",
      value: rejectedApplications,
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-red-50",
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