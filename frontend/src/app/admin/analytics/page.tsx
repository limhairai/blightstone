"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
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
  Search
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { adminMockData } from "../../../lib/mock-data/admin-mock-data";
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

  // Get real data we can actually track
  const allClients = adminMockData.getClients();
  const allTransactions = adminMockData.getTransactions();
  const allApplications = adminMockData.getApplications();
  const allBusinesses = adminMockData.getBusinesses();

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
      }
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

  return (
    <div className="space-y-6 p-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {allClients.slice(0, 10).map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
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

      {/* Key Metrics Cards - matching your dashboard card style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{analytics.clients.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.clients.active} active
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.monthly)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(analytics.revenue.total)} total
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Applications</p>
                <p className="text-2xl font-bold">{analytics.applications.business}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ad Account Applications</p>
                <p className="text-2xl font-bold">{analytics.applications.adAccount}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end justify-between px-2">
              {trendData.slice(-14).map((data, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div
                    className="w-4 bg-gradient-to-t from-[#b4a0ff] to-[#ffb4a0] rounded-sm mb-2 transition-opacity group-hover:opacity-80"
                    style={{ 
                      height: `${Math.max(8, (data.revenue / Math.max(...trendData.map(d => d.revenue))) * 160)}px` 
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(data.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Approved</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{analytics.applications.approved}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{analytics.applications.pending}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Client Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.clients.newThisMonth}</div>
            <p className="text-sm text-muted-foreground">New clients this month</p>
            <div className="mt-4">
              <div className="text-sm font-medium">Average Revenue per Client</div>
              <div className="text-lg">{formatCurrency(analytics.clients.avgRevenue)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Business Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.businesses.total}</div>
            <p className="text-sm text-muted-foreground">Total businesses</p>
            <div className="mt-4">
              <div className="text-sm font-medium">Active Businesses</div>
              <div className="text-lg">{analytics.businesses.active}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.volume)}</div>
            <p className="text-sm text-muted-foreground">Total processed</p>
            <div className="mt-4">
              <div className="text-sm font-medium">Total Transactions</div>
              <div className="text-lg">{analytics.transactions.total.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 