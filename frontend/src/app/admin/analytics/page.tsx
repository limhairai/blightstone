"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Building2,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  Filter,
  Search,
  Activity,
  CreditCard,
  Target,
  Calendar,
  Zap,
  Globe
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
// TODO: Replace with real admin data service
// import { adminAppData } from "../../../lib/mock-data/admin-mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../components/ui/select";

export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState("30 days");
  const [timeRange, setTimeRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [metricType, setMetricType] = useState("revenue");

  // TODO: Replace with real data from Supabase admin service
  const allClients: any[] = [];
  const allTransactions: any[] = [];
  const allApplications: any[] = [];
  const allBusinesses: any[] = [];

  // Calculate realistic metrics from actual data
  const analytics = useMemo(() => {
    // Client metrics
    const totalClients = allClients.length;
    const activeClients = allClients.filter(c => c.status === 'active').length;
    const newClientsThisMonth = allClients.filter(c => {
      const joinDate = new Date(c.joinDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return joinDate > thirtyDaysAgo;
    }).length;

    // Financial metrics from transactions
    const totalRevenue = allTransactions
      .filter(t => t.type === 'fee' || t.type === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyRevenue = allTransactions
      .filter(t => {
        const txDate = new Date(t.date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return txDate > thirtyDaysAgo && (t.type === 'fee' || t.type === 'commission');
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const totalVolume = allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0;

    // Application metrics
    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter(a => a.stage === 'received' || a.stage === 'document_prep' || a.stage === 'submitted' || a.stage === 'under_review').length;
    const approvedApplications = allApplications.filter(a => a.stage === 'approved').length;
    const businessApplications = allApplications.filter(a => a.type === 'new_business');
    const adAccountApplications = allApplications.filter(a => a.type === 'ad_account');

    // Business metrics
    const totalBusinesses = allBusinesses.length;
    const activeBusinesses = allBusinesses.filter(b => b.status === 'active').length;

    // Transaction success rate (something we can actually track)
    const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
    const transactionSuccessRate = allTransactions.length > 0 ? (completedTransactions / allTransactions.length) * 100 : 0;

    // Growth calculations (mock data)
    const revenueGrowth = 12.5;
    const clientGrowth = 8.3;
    const businessGrowth = 15.2;
    const applicationGrowth = 22.1;

    // Top performers
    const topClients = allClients
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    const topBusinesses = allBusinesses
      .sort((a, b) => b.monthlySpend - a.monthlySpend)
      .slice(0, 5);

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
        avgRevenue: avgRevenuePerClient
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        volume: totalVolume
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        approved: approvedApplications,
        business: businessApplications.length,
        adAccount: adAccountApplications.length
      },
      businesses: {
        total: totalBusinesses,
        active: activeBusinesses
      },
      transactions: {
        total: allTransactions.length,
        successRate: transactionSuccessRate
      },
      revenueGrowth,
      clientGrowth,
      businessGrowth,
      applicationGrowth,
      topClients,
      topBusinesses,
      conversionRate: (approvedApplications / totalApplications * 100).toFixed(1),
      avgRevenuePerClient,
      avgBusinessesPerClient: (totalBusinesses / totalClients).toFixed(1)
    };
  }, [allClients, allTransactions, allApplications, allBusinesses]);

  // Generate trend data (simplified, realistic)
  const trendData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return days.map((date, i) => {
      // Simulate realistic daily metrics
      const baseRevenue = analytics.revenue.monthly / 30;
      const dailyVariation = (Math.random() - 0.5) * baseRevenue * 0.3;
      
      return {
        date,
        revenue: Math.max(0, baseRevenue + dailyVariation),
        newClients: Math.floor(Math.random() * 3), // 0-2 new clients per day
        applications: Math.floor(Math.random() * 5) + 1 // 1-5 applications per day
      };
    });
  }, [analytics.revenue.monthly]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = "up",
    description 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    trend?: "up" | "down";
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`text-xs flex items-center gap-1 ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {change} from last month
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and growth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.revenue.total)}
          change={`+${analytics.revenueGrowth}%`}
          icon={DollarSign}
          description="All-time platform revenue"
        />
        <StatCard
          title="Active Clients"
          value={analytics.clients.active}
          change={`+${analytics.clientGrowth}%`}
          icon={Users}
          description={`${analytics.clients.total} total clients`}
        />
        <StatCard
          title="Total Businesses"
          value={analytics.businesses.total}
          change={`+${analytics.businessGrowth}%`}
          icon={Building2}
          description={`${analytics.avgBusinessesPerClient} avg per client`}
        />
        <StatCard
          title="Applications"
          value={analytics.applications.total}
          change={`+${analytics.applicationGrowth}%`}
          icon={Target}
          description={`${analytics.conversionRate}% approval rate`}
        />
      </div>

      {/* Revenue Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Monthly revenue analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Revenue</span>
                <span className="text-lg font-bold">{formatCurrency(analytics.revenue.monthly)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average per Client</span>
                <span className="text-lg font-bold">{formatCurrency(analytics.avgRevenuePerClient)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Growth Rate</span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold">+{analytics.revenueGrowth}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Application status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Applications</span>
                <span className="text-lg font-bold">{analytics.applications.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approved</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">{analytics.applications.approved}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({analytics.conversionRate}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Review</span>
                <Badge className="bg-yellow-100 text-yellow-800">{analytics.applications.pending}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
            <CardDescription>Highest spending clients this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.company}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(client.totalSpend)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(client.monthlySpend)}/mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Businesses by Spend</CardTitle>
            <CardDescription>Highest spending businesses this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topBusinesses.map((business, index) => (
                <div key={business.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{business.name}</div>
                      <div className="text-sm text-muted-foreground">{business.industry}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(business.monthlySpend)}</div>
                    <Badge className={`text-xs ${
                      business.status === 'active' ? 'bg-green-100 text-green-800' :
                      business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {business.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Metrics</CardTitle>
          <CardDescription>Key performance indicators and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Platform Uptime</div>
                <div className="text-lg font-bold">99.9%</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-lg font-bold">120ms</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">API Requests</div>
                <div className="text-lg font-bold">2.4M</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 