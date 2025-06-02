"use client"

import { ArrowUpRight, Wallet, FolderKanban, CreditCard } from "lucide-react"

export function AccountsMetrics() {
  // Mock data - in a real app, this would come from an API
  const metrics = [
    {
      title: "Total accounts",
      value: "0",
      limit: "50",
      percentage: 0,
      icon: CreditCard,
      trend: null,
    },
    {
      title: "Projects",
      value: "0",
      icon: FolderKanban,
      trend: null,
    },
    {
      title: "Total balance",
      value: "$0.00 USD",
      icon: Wallet,
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</p>
              <div className="flex items-baseline">
                <h3 className="text-2xl font-bold tracking-tight">
                  {metric.value}
                  {metric.limit && (
                    <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">/ {metric.limit}</span>
                  )}
                </h3>
                {metric.trend && (
                  <span className="ml-2 flex items-center text-sm font-medium text-green-600">
                    {metric.trend > 0 ? "+" : ""}
                    {metric.trend}%
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </span>
                )}
              </div>

              {metric.percentage !== undefined && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 mt-2">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <metric.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
