"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from "react";
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
  Globe,
  Percent
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useAuth } from "../../../contexts/AuthContext";
import { formatCurrency } from "../../../utils/format";
import { formatDistanceToNow } from "date-fns";

interface TopupRequest {
  id: string;
  organization_id: string;
  ad_account_name: string;
  amount_cents: number;
  fee_amount_cents?: number;
  total_deducted_cents?: number;
  plan_fee_percentage?: number;
  status: string;
  created_at: string;
  organization?: {
    name: string;
    plan_id?: string;
  };
}

interface Organization {
  organization_id: string;
  name: string;
  plan_id?: string;
  created_at: string;
  subscription_status?: string;
  balance_cents?: number;
}

interface BusinessMetrics {
  // Revenue Metrics
  totalRevenue: number;
  subscriptionMRR: number;
  transactionFeeRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  
  // Customer Metrics
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  customerGrowth: number;
  churnRate: number;
  
  // Business Health
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  adSpendVolume: number;
  
  // Plan Distribution
  planDistribution: Record<string, number>;
  revenueByPlan: Record<string, number>;
}

export default function BusinessAnalyticsPage() {
  const { session } = useAuth();
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("30d");

  const fetchData = async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      // Fetch topup requests for transaction fee revenue
      const topupResponse = await fetch('/api/admin/topup-requests', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      // Fetch organizations for subscription metrics
      const orgsResponse = await fetch('/api/admin/organizations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (topupResponse.ok) {
        const topupData = await topupResponse.json();
        setTopupRequests(topupData.requests || []);
      }
      
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations || []);
      } else {
        // Fallback: try the regular organizations API
        const fallbackResponse = await fetch('/api/organizations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setOrganizations(fallbackData.organizations || []);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  // Calculate comprehensive business metrics
  const businessMetrics = useMemo((): BusinessMetrics => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Plan pricing (monthly subscription fees)
    const planPricing: Record<string, number> = {
      'starter': 29,
      'growth': 149,
      'scale': 499,
      'enterprise': 1499
    };
    
    // === REVENUE METRICS ===
    
    // Subscription MRR calculation
    const subscriptionMRR = organizations.reduce((sum, org) => {
      const planPrice = planPricing[org.plan_id || 'starter'] || 29;
      return sum + planPrice;
    }, 0);
    
    // Transaction fee revenue (all time)
    const feeRequests = topupRequests.filter(req => req.fee_amount_cents && req.fee_amount_cents > 0);
    const transactionFeeRevenue = feeRequests.reduce((sum, req) => 
      sum + (req.fee_amount_cents || 0), 0
    ) / 100;
    
    // Monthly transaction fee revenue
    const monthlyFeeRequests = feeRequests.filter(req => 
      new Date(req.created_at) > thirtyDaysAgo
    );
    const monthlyTransactionFees = monthlyFeeRequests.reduce((sum, req) => 
      sum + (req.fee_amount_cents || 0), 0
    ) / 100;
    
    // Total revenue
    const totalRevenue = transactionFeeRevenue + (subscriptionMRR * 12); // Annualized
    const monthlyRevenue = subscriptionMRR + monthlyTransactionFees;
    
    // Previous month for growth calculation
    const previousMonthFees = feeRequests.filter(req => {
      const date = new Date(req.created_at);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).reduce((sum, req) => sum + (req.fee_amount_cents || 0), 0) / 100;
    
    const previousMonthRevenue = subscriptionMRR + previousMonthFees;
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0;
    
    // === CUSTOMER METRICS ===
    
    const totalCustomers = organizations.length;
    const activeCustomers = organizations.filter(org => 
      org.subscription_status !== 'cancelled' && org.subscription_status !== 'frozen'
    ).length;
    
    const newCustomersThisMonth = organizations.filter(org => 
      new Date(org.created_at) > thirtyDaysAgo
    ).length;
    
    const previousMonthCustomers = organizations.filter(org => 
      new Date(org.created_at) <= thirtyDaysAgo
    ).length;
    
    const customerGrowth = previousMonthCustomers > 0 
      ? (newCustomersThisMonth / previousMonthCustomers) * 100
      : newCustomersThisMonth > 0 ? 100 : 0;
    
    // Simple churn calculation (cancelled/frozen vs total)
    const churned = organizations.filter(org => 
      org.subscription_status === 'cancelled' || org.subscription_status === 'frozen'
    ).length;
    const churnRate = totalCustomers > 0 ? (churned / totalCustomers) * 100 : 0;
    
    // === BUSINESS HEALTH ===
    
    const averageRevenuePerUser = activeCustomers > 0 ? monthlyRevenue / activeCustomers : 0;
    
    // Simple LTV calculation: ARPU / Churn Rate (monthly)
    const monthlyChurnRate = churnRate / 100;
    const customerLifetimeValue = monthlyChurnRate > 0 ? averageRevenuePerUser / monthlyChurnRate : averageRevenuePerUser * 24;
    
    // Ad spend volume (from topup amounts)
    const adSpendVolume = topupRequests.reduce((sum, req) => 
      sum + req.amount_cents, 0
    ) / 100;
    
    // === PLAN DISTRIBUTION ===
    
    const planDistribution: Record<string, number> = {};
    const revenueByPlan: Record<string, number> = {};
    
    organizations.forEach(org => {
      const planId = org.plan_id || 'starter';
      planDistribution[planId] = (planDistribution[planId] || 0) + 1;
      revenueByPlan[planId] = (revenueByPlan[planId] || 0) + (planPricing[planId] || 29);
    });
    
    // Add transaction fees to plan revenue
    feeRequests.forEach(req => {
      const planId = req.organization?.plan_id || 'starter';
      revenueByPlan[planId] = (revenueByPlan[planId] || 0) + (req.fee_amount_cents || 0) / 100;
    });
    
    return {
      totalRevenue,
      subscriptionMRR,
      transactionFeeRevenue,
      monthlyRevenue,
      revenueGrowth,
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customerGrowth,
      churnRate,
      averageRevenuePerUser,
      customerLifetimeValue,
      adSpendVolume,
      planDistribution,
      revenueByPlan
    };
  }, [topupRequests, organizations]);

  const getPlanName = (planId?: string) => {
    const plans: Record<string, string> = {
      'starter': 'Starter',
      'growth': 'Growth', 
      'scale': 'Scale',
      'enterprise': 'Enterprise'
    };
    return plans[planId || ''] || 'Starter';
  };

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-3 w-3" />
          <span>+{growth.toFixed(1)}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ArrowDownRight className="h-3 w-3" />
          <span>{growth.toFixed(1)}%</span>
        </div>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading business analytics...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-1">
            Complete overview of your SaaS business performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(businessMetrics.monthlyRevenue)}
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                {getGrowthIndicator(businessMetrics.revenueGrowth)}
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subscription MRR</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(businessMetrics.subscriptionMRR)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monthly recurring revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Fees</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(businessMetrics.transactionFeeRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time ad spend fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(businessMetrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Annualized total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {businessMetrics.activeCustomers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {businessMetrics.totalCustomers} total organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {businessMetrics.newCustomersThisMonth}
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                {getGrowthIndicator(businessMetrics.customerGrowth)}
                <span className="text-muted-foreground">growth rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">
                {businessMetrics.churnRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cancelled/frozen accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Revenue/User</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(businessMetrics.averageRevenuePerUser)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monthly ARPU</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Health */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Business Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customer LTV</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(businessMetrics.customerLifetimeValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Estimated lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ad Spend Volume</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(businessMetrics.adSpendVolume)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total client ad spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">LTV:CAC Ratio</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-600">
                {businessMetrics.customerLifetimeValue > 0 ? (businessMetrics.customerLifetimeValue / 100).toFixed(1) : '∞'}:1
              </div>
              <p className="text-xs text-muted-foreground mt-1">Estimated ratio</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Distribution */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Plan Distribution & Revenue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Distribution</CardTitle>
              <CardDescription>Number of customers per plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(businessMetrics.planDistribution).map(([planId, count]) => (
                  <div key={planId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        planId === 'starter' ? 'bg-green-500' :
                        planId === 'growth' ? 'bg-blue-500' :
                        planId === 'scale' ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <span className="font-medium">{getPlanName(planId)}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground">
                        {businessMetrics.totalCustomers > 0 ? 
                          ((count / businessMetrics.totalCustomers) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Plan</CardTitle>
              <CardDescription>Total revenue contribution per plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(businessMetrics.revenueByPlan).map(([planId, revenue]) => (
                  <div key={planId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        planId === 'starter' ? 'bg-green-500' :
                        planId === 'growth' ? 'bg-blue-500' :
                        planId === 'scale' ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <span className="font-medium">{getPlanName(planId)}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        {businessMetrics.totalRevenue > 0 ? 
                          ((revenue / businessMetrics.totalRevenue) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 