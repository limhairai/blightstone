# Missing Admin Panel Pages - Code Export for v0

This document contains the complete code for all admin panel pages that weren't included in the previous export. Use this code with v0 for redesigning the admin interface.

## Table of Contents
1. [Finances Page](#finances-page)
2. [Businesses Page](#businesses-page) 
3. [Analytics Page](#analytics-page)
4. [Organizations Page](#organizations-page)
5. [Activity Page](#activity-page)
6. [Transactions Page](#transactions-page)
7. [Files Page](#files-page)
8. [Stats Page](#stats-page)

---

## Finances Page

**File:** `frontend/src/app/admin/finances/page.tsx`

**Description:** Comprehensive billing and financial management page with transaction tracking, risk assessment, and financial analytics.

**Key Features:**
- Enhanced transaction data with risk scoring
- Client financial health analysis  
- Financial statistics and KPIs
- Advanced filtering and search
- Virtualized table for performance
- Critical alerts system

```tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Wallet,
  Receipt,
  Target,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Shield,
  Zap,
  Activity,
  Bell,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { VirtualizedTable } from "../../../components/admin/VirtualizedTable";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { adminMockData, MockTransaction, MockClient } from "../../../lib/mock-data/admin-mock-data";

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [alertsFilter, setAlertsFilter] = useState("all");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all financial data
  const allTransactions = adminMockData.getTransactions();
  const allClients = adminMockData.getClients();

  // Enhanced transaction data with risk scoring
  const enhancedTransactions = useMemo(() => {
    return allTransactions.map(transaction => ({
      ...transaction,
      riskScore: Math.floor(Math.random() * 100),
      paymentId: `pay_${Math.random().toString(36).substr(2, 24)}`,
      transactionId: `txn_${Math.random().toString(36).substr(2, 24)}`,
      reconciled: Math.random() > 0.05, // 95% reconciled
      processingTime: Math.floor(Math.random() * 300) + 50, // 50-350ms
      retryCount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0
    }));
  }, [allTransactions]);

  // Client financial health data
  const clientFinancials = useMemo(() => {
    return allClients.map(client => {
      const clientTransactions = allTransactions.filter(t => t.clientId === client.id);
      const totalVolume = clientTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const failedTransactions = clientTransactions.filter(t => t.status === 'failed').length;
      const failureRate = clientTransactions.length > 0 ? (failedTransactions / clientTransactions.length) * 100 : 0;
      
      return {
        ...client,
        totalVolume,
        failureRate,
        lastPayment: clientTransactions.length > 0 ? clientTransactions[0].date : null,
        avgTransactionSize: clientTransactions.length > 0 ? totalVolume / clientTransactions.length : 0,
        riskLevel: failureRate > 10 ? 'high' : failureRate > 5 ? 'medium' : 'low',
        customerId: `cus_${Math.random().toString(36).substr(2, 14)}`,
        paymentMethods: Math.floor(Math.random() * 3) + 1,
        autoTopupEnabled: Math.random() > 0.3,
        creditUtilization: client.balance < 0 ? Math.abs(client.balance) / client.creditLimit * 100 : 0
      };
    });
  }, [allClients, allTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return enhancedTransactions
      .filter(transaction => {
        const matchesSearch = !debouncedTerm || 
          transaction.id.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          transaction.clientName.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          transaction.description.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          transaction.reference?.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
        const matchesType = typeFilter === "all" || transaction.type === typeFilter;
        const matchesClient = clientFilter === "all" || transaction.clientId === clientFilter;
        
        return matchesSearch && matchesStatus && matchesType && matchesClient;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "date":
            aVal = new Date(a.date).getTime();
            bVal = new Date(b.date).getTime();
            break;
          case "amount":
            aVal = Math.abs(a.amount);
            bVal = Math.abs(b.amount);
            break;
          case "client":
            aVal = a.clientName;
            bVal = b.clientName;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [enhancedTransactions, debouncedTerm, statusFilter, typeFilter, clientFilter, sortBy, sortOrder]);

  // Financial statistics
  const stats = useMemo(() => {
    const total = allTransactions.length;
    const completed = allTransactions.filter(t => t.status === 'completed').length;
    const pending = allTransactions.filter(t => t.status === 'pending').length;
    const failed = allTransactions.filter(t => t.status === 'failed').length;
    
    const totalVolume = allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalRevenue = allTransactions
      .filter(t => t.type === 'commission' || t.type === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avgTransactionSize = total > 0 ? totalVolume / total : 0;
    const successRate = total > 0 ? (completed / total) * 100 : 0;
    
    const highRiskClients = clientFinancials.filter(c => c.riskLevel === 'high').length;
    const overdueClients = clientFinancials.filter(c => c.balance < 0).length;
    
    const reconciliationRate = enhancedTransactions.filter(t => t.reconciled).length / total * 100;
    const avgProcessingTime = enhancedTransactions.reduce((sum, t) => sum + t.processingTime, 0) / total;
    
    return {
      total,
      completed,
      pending,
      failed,
      totalVolume,
      totalRevenue,
      avgTransactionSize,
      successRate,
      highRiskClients,
      overdueClients,
      reconciliationRate,
      avgProcessingTime
    };
  }, [allTransactions, clientFinancials, enhancedTransactions]);

  // Critical alerts
  const criticalAlerts = useMemo(() => {
    const alerts = [];
    
    // Failed payment alerts
    const recentFailures = enhancedTransactions.filter(t => 
      t.status === 'failed' && 
      new Date(t.date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentFailures.length > 10) {
      alerts.push({
        id: 'high_failure_rate',
        type: 'critical',
        title: 'High Failure Rate Detected',
        message: `${recentFailures.length} failed transactions in last 24h`,
        action: 'Review payment processing'
      });
    }
    
    return alerts;
  }, [enhancedTransactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      deposit: "bg-green-100 text-green-800",
      withdrawal: "bg-blue-100 text-blue-800",
      spend: "bg-purple-100 text-purple-800",
      refund: "bg-orange-100 text-orange-800",
      fee: "bg-indigo-100 text-indigo-800",
      commission: "bg-pink-100 text-pink-800"
    };
    
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {type.toUpperCase()}
    </Badge>;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Virtualized table columns
  const columns = [
    {
      key: "id",
      header: "Transaction ID",
      width: 140,
      render: (transaction: any) => (
        <div>
          <div className="font-mono text-sm">{transaction.id}</div>
          <div className="text-xs text-gray-500">
            {transaction.paymentId.slice(0, 12)}...
          </div>
        </div>
      )
    },
    {
      key: "client",
      header: "Client",
      width: 180,
      render: (transaction: any) => (
        <div>
          <div className="font-medium">{transaction.clientName}</div>
          <div className="text-sm text-gray-500">{transaction.businessName}</div>
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      width: 100,
      render: (transaction: any) => getTypeBadge(transaction.type)
    },
    {
      key: "amount",
      header: "Amount",
      width: 120,
      render: (transaction: any) => (
        <div className="text-right">
          <div className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(transaction.amount)}
          </div>
          <div className="text-xs text-gray-500">
            Fee: {formatCurrency(transaction.processingFee)}
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      width: 120,
      render: (transaction: any) => (
        <div className="space-y-1">
          {getStatusBadge(transaction.status)}
          {!transaction.reconciled && (
            <div className="text-xs text-orange-600">Unreconciled</div>
          )}
        </div>
      )
    },
    {
      key: "date",
      header: "Date",
      width: 120,
      render: (transaction: any) => (
        <div>
          <div className="text-sm">{formatDate(transaction.date)}</div>
          <div className="text-xs text-gray-500">
            {transaction.processingTime}ms
          </div>
        </div>
      )
    },
    {
      key: "reference",
      header: "Reference",
      width: 140,
      render: (transaction: any) => (
        <div>
          <div className="font-mono text-xs">{transaction.reference}</div>
          {transaction.retryCount > 0 && (
            <div className="text-xs text-orange-600">
              {transaction.retryCount} retries
            </div>
          )}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: 80,
      render: (transaction: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Payment Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Payment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Receipt className="h-4 w-4 mr-2" />
              Generate Receipt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-end">
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

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map(alert => (
            <Alert key={alert.id} className={alert.type === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>: {alert.message}
                  </div>
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reconciled</p>
                <p className="text-2xl font-bold">{stats.reconciliationRate.toFixed(1)}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Speed</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgProcessingTime)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="spend">Spend</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
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

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredTransactions.length.toLocaleString()} of {stats.total.toLocaleString()} transactions
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Sort: {sortBy}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Virtualized Transaction Table */}
      <Card>
        <CardContent className="p-0">
          <VirtualizedTable
            data={filteredTransactions}
            columns={columns}
            height={600}
            itemHeight={70}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Businesses Page

**File:** `frontend/src/app/admin/businesses/page.tsx`

**Description:** Business management interface with verification tracking, expandable rows, and comprehensive business analytics.

**Key Features:**
- Business verification status tracking
- Expandable rows showing ad account details
- Industry categorization
- Spend tracking (total and monthly)
- Status management (active/suspended/pending)

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  Building2,
  Search,
  Download,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  DollarSign,
  CreditCard,
  TrendingUp,
  Activity,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Users,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import React from "react";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { adminMockData, MockBusiness, MockAdAccount } from "../../../lib/mock-data/admin-mock-data";

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalSpend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all business data
  const allBusinesses = adminMockData.getBusinesses();
  const allAdAccounts = adminMockData.getAdAccounts();

  // Filter and sort data
  const filteredData = useMemo(() => {
    return allBusinesses
      .filter(business => {
        const matchesSearch = !debouncedTerm || 
          business.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          business.clientName.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          business.industry.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || business.status === statusFilter;
        const matchesVerification = verificationFilter === "all" || business.verificationStatus === verificationFilter;
        
        return matchesSearch && matchesStatus && matchesVerification;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "name":
            aVal = a.name;
            bVal = b.name;
            break;
          case "totalSpend":
            aVal = a.totalSpend;
            bVal = b.totalSpend;
            break;
          case "monthlySpend":
            aVal = a.monthlySpend;
            bVal = b.monthlySpend;
            break;
          case "adAccountCount":
            aVal = a.adAccountCount;
            bVal = b.adAccountCount;
            break;
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "lastActivity":
            aVal = new Date(a.lastActivity).getTime();
            bVal = new Date(b.lastActivity).getTime();
            break;
          case "clientName":
            aVal = a.clientName;
            bVal = b.clientName;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [allBusinesses, debouncedTerm, statusFilter, verificationFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = allBusinesses.length;
    const active = allBusinesses.filter(b => b.status === 'active').length;
    const suspended = allBusinesses.filter(b => b.status === 'suspended').length;
    const pending = allBusinesses.filter(b => b.status === 'pending').length;
    const verified = allBusinesses.filter(b => b.verificationStatus === 'verified').length;
    
    const totalSpend = allBusinesses.reduce((sum, b) => sum + b.totalSpend, 0);
    const totalMonthlySpend = allBusinesses.reduce((sum, b) => sum + b.monthlySpend, 0);
    const totalAdAccounts = allBusinesses.reduce((sum, b) => sum + b.adAccountCount, 0);
    
    const byIndustry = allBusinesses.reduce((acc, b) => {
      acc[b.industry] = (acc[b.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      active,
      suspended,
      pending,
      verified,
      totalSpend,
      totalMonthlySpend,
      totalAdAccounts,
      byIndustry
    };
  }, [allBusinesses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "not_verified":
        return <Badge className="bg-gray-100 text-gray-800">Not Verified</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBusinessAdAccounts = (businessId: string): MockAdAccount[] => {
    return allAdAccounts.filter(account => account.businessId === businessId);
  };

  const toggleRowExpansion = (businessId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(businessId)) {
      newExpanded.delete(businessId);
    } else {
      newExpanded.add(businessId);
    }
    setExpandedRows(newExpanded);
  };

  const renderExpandedContent = (business: MockBusiness) => {
    const adAccounts = getBusinessAdAccounts(business.id);
    
    return (
      <div className="p-4 bg-gray-50 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Business Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Industry:</span> {business.industry}</p>
              <p><span className="font-medium">Created:</span> {formatDate(business.createdAt)}</p>
              <p><span className="font-medium">Last Activity:</span> {formatDate(business.lastActivity)}</p>
              <p><span className="font-medium">Client:</span> {business.clientName}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Ad Accounts ({adAccounts.length})</h4>
            <div className="space-y-2">
              {adAccounts.slice(0, 3).map(account => (
                <div key={account.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-gray-500">{account.platform}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(account.monthlySpend)}</div>
                    <Badge className={account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {adAccounts.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{adAccounts.length - 3} more ad accounts
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
          <p className="text-muted-foreground">
            Manage client businesses and verification status
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.suspended} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalMonthlySpend)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.verified / stats.total) * 100).toFixed(1)}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {(stats.totalAdAccounts / stats.total).toFixed(1)} avg per business
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_verified">Not Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses ({filteredData.length})</CardTitle>
          <CardDescription>Manage client businesses and their verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredData.map((business) => (
              <div key={business.id}>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(business.id)}
                    >
                      {expandedRows.has(business.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <div className="font-medium">{business.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {business.clientName} • {business.industry}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(business.totalSpend)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(business.monthlySpend)}/month
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(business.status)}
                      {getVerificationBadge(business.verificationStatus)}
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{business.adAccountCount}</div>
                      <div className="text-xs text-muted-foreground">accounts</div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Building2 className="h-4 w-4 mr-2" />
                          Manage Business
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Update Verification
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {expandedRows.has(business.id) && renderExpandedContent(business)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}