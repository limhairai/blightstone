"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';
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
import { adminAppData, AppBusiness, AppAdAccount } from "../../../lib/mock-data/admin-mock-data";

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalSpend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all business data
  const allBusinesses = adminAppData.getBusinesses();
  const allAdAccounts = adminAppData.getAdAccounts();

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

  const getBusinessAdAccounts = (businessId: string): AppAdAccount[] => {
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

  // Render expanded content for businesses (show ad accounts)
  const renderExpandedContent = (business: AppBusiness) => {
    const adAccounts = getBusinessAdAccounts(business.id);
    
    if (adAccounts.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No ad accounts found for this business
        </div>
      );
    }

    return (
      <div className="p-4">
        <h4 className="font-medium mb-3 text-sm text-muted-foreground">
          Ad Accounts ({adAccounts.length})
        </h4>
        <div className="space-y-2">
          {adAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {account.accountId}</div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(account.status)}
                    <Badge variant="outline" className="text-xs">
                      {account.currency}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{formatCurrency(account.spend)}</div>
                  <div className="text-xs text-muted-foreground">Spend</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatCurrency(account.limit)}</div>
                  <div className="text-xs text-muted-foreground">Limit</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{account.utilization}%</div>
                  <div className="text-xs text-muted-foreground">Usage</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{account.campaignCount}</div>
                  <div className="text-xs text-muted-foreground">Campaigns</div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/ad-accounts/${account.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verified.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalMonthlySpend)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ad Accounts</p>
                <p className="text-2xl font-bold">{stats.totalAdAccounts.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSpend">Total Spend</SelectItem>
                <SelectItem value="monthlySpend">Monthly Spend</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="lastActivity">Last Activity</SelectItem>
                <SelectItem value="adAccountCount">Ad Account Count</SelectItem>
                <SelectItem value="clientName">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length.toLocaleString()} of {stats.total.toLocaleString()} businesses
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

      {/* Businesses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium w-8"></th>
                  <th className="text-left p-4 font-medium">Business</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Verification</th>
                  <th className="text-left p-4 font-medium">Industry</th>
                  <th className="text-left p-4 font-medium">Ad Accounts</th>
                  <th className="text-left p-4 font-medium">Total Spend</th>
                  <th className="text-left p-4 font-medium">Monthly Spend</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Last Activity</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((business) => {
                  const adAccounts = getBusinessAdAccounts(business.id);
                  const isExpanded = expandedRows.has(business.id);
                  
                  return (
                    <React.Fragment key={business.id}>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(business.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-blue-600">{business.name}</div>
                            <div className="text-sm text-muted-foreground">{business.clientName}</div>
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(business.status)}</td>
                        <td className="p-4">{getVerificationBadge(business.verificationStatus)}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {business.industry}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-center">
                            <div className="font-medium">{business.adAccountCount}</div>
                            <div className="text-xs text-gray-500">accounts</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{formatCurrency(business.totalSpend)}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{formatCurrency(business.monthlySpend)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">{formatDate(business.createdAt)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">{formatDate(business.lastActivity)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/businesses/${business.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
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
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Billing
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity className="h-4 w-4 mr-2" />
                                  Analytics
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="p-0">
                            {renderExpandedContent(business)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 