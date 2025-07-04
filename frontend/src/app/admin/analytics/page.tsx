"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  RefreshCw,
  Download,
  Search,
  Building2,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
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

interface AnalyticsRow {
  id: string;
  type: 'revenue' | 'customer' | 'plan';
  label: string;
  value: string;
  details?: string;
}

export default function BusinessAnalyticsPage() {
  const { session } = useAuth();
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchData = async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const [topupResponse, orgsResponse] = await Promise.all([
        fetch('/api/admin/topup-requests', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);
      
      if (topupResponse.ok) {
        const topupData = await topupResponse.json();
        setTopupRequests(topupData.requests || []);
      }
      
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations || []);
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

  const analyticsData = useMemo((): AnalyticsRow[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const planPricing: Record<string, number> = {
      'starter': 29,
      'growth': 149,
      'scale': 499,
      'enterprise': 1499
    };

    const planNames: Record<string, string> = {
      'starter': 'Starter',
      'growth': 'Growth', 
      'scale': 'Scale',
      'enterprise': 'Enterprise'
    };
    
    // Debug logging
    console.log('Analytics Debug - Organizations:', organizations);
    console.log('Analytics Debug - Plan Pricing:', planPricing);
    
    const subscriptionMRR = organizations.reduce((sum, org) => {
      const planId = org.plan_id || 'starter';
      const planPrice = planPricing[planId] || 29;
      console.log(`Analytics Debug - Org: ${org.name}, Plan ID: ${planId}, Price: ${planPrice}`);
      return sum + planPrice;
    }, 0);
    
    console.log('Analytics Debug - Total MRR:', subscriptionMRR);
    
    const feeRequests = topupRequests.filter(req => req.fee_amount_cents && req.fee_amount_cents > 0);
    const transactionFeeRevenue = feeRequests.reduce((sum, req) => 
      sum + (req.fee_amount_cents || 0), 0
    ) / 100;
    
    const monthlyFeeRequests = feeRequests.filter(req => 
      new Date(req.created_at) > thirtyDaysAgo
    );
    const monthlyFeeRevenue = monthlyFeeRequests.reduce((sum, req) => 
      sum + (req.fee_amount_cents || 0), 0
    ) / 100;
    
    const totalRevenue = subscriptionMRR + monthlyFeeRevenue;
    const totalCustomers = organizations.length;
    const newCustomersThisMonth = organizations.filter(org => 
      new Date(org.created_at) > thirtyDaysAgo
    ).length;
    
    const planDistribution = organizations.reduce((acc, org) => {
      const planId = org.plan_id || 'starter';
      console.log(`Analytics Debug - Plan Distribution - Org: ${org.name}, Plan: ${planId}`);
      acc[planId] = (acc[planId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Analytics Debug - Plan Distribution:', planDistribution);

    const rows: AnalyticsRow[] = [
      {
        id: 'subscription-mrr',
        type: 'revenue',
        label: 'Monthly Recurring Revenue',
        value: formatCurrency(subscriptionMRR),
        details: 'Subscription fees'
      },
      {
        id: 'transaction-fees',
        type: 'revenue', 
        label: 'Transaction Fee Revenue',
        value: formatCurrency(transactionFeeRevenue),
        details: 'All-time ad spend fees'
      },
      {
        id: 'monthly-fees',
        type: 'revenue',
        label: 'Monthly Fee Revenue',
        value: formatCurrency(monthlyFeeRevenue),
        details: 'Last 30 days'
      },
      {
        id: 'total-revenue',
        type: 'revenue',
        label: 'Total Monthly Revenue',
        value: formatCurrency(totalRevenue),
        details: 'MRR + monthly fees'
      },
      {
        id: 'total-customers',
        type: 'customer',
        label: 'Total Organizations',
        value: totalCustomers.toString(),
        details: 'All registered'
      },
      {
        id: 'new-customers',
        type: 'customer',
        label: 'New This Month',
        value: newCustomersThisMonth.toString(),
        details: 'Last 30 days'
      },
      {
        id: 'avg-revenue',
        type: 'customer',
        label: 'Average Revenue Per User',
        value: formatCurrency(totalCustomers > 0 ? totalRevenue / totalCustomers : 0),
        details: 'Monthly ARPU'
      },
      ...Object.entries(planDistribution).map(([planId, count]) => ({
        id: `plan-${planId}`,
        type: 'plan' as const,
        label: `${planNames[planId] || planId} Plan`,
        value: count.toString(),
        details: `${totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : 0}% of customers`
      }))
    ];

    return rows;
  }, [organizations, topupRequests]);

  const filteredData = useMemo(() => {
    return analyticsData.filter(row => {
      const categoryFilter = selectedCategory === "all" || row.type === selectedCategory;
      const searchFilter = searchTerm === "" || 
        row.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryFilter && searchFilter;
    });
  }, [analyticsData, selectedCategory, searchTerm]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case 'customer':
        return <Users className="h-4 w-4 text-muted-foreground" />;
      case 'plan':
        return <Building2 className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      'revenue': 'default',
      'customer': 'secondary', 
      'plan': 'outline'
    };
    
    return (
      <Badge variant={variants[type] as any} className="capitalize">
        {type}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="plan">Plan</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No analytics data found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {getTypeIcon(row.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.label}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{row.value}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{row.details}</div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(row.type)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {analyticsData.length} metrics
      </div>
    </div>
  );
} 