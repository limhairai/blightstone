"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft,
  Users,
  Building2,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
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
import { adminMockData, MockClient, MockBusiness } from "../../../lib/mock-data/admin-mock-data";
import { MOCK_PROFILE_TEAMS, MOCK_TEAM_BUSINESS_MANAGERS } from "../../../lib/mock-data";

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalSpend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all client data (organizations)
  const allClients = adminMockData.getClients();
  const allBusinesses = adminMockData.getBusinesses();

  // Filter and sort data
  const filteredData = useMemo(() => {
    return allClients
      .filter(client => {
        const matchesSearch = !debouncedTerm || 
          client.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          client.company.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || client.status === statusFilter;
        const matchesTier = tierFilter === "all" || client.tier === tierFilter;
        
        return matchesSearch && matchesStatus && matchesTier;
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
          case "businessCount":
            aVal = a.businessCount;
            bVal = b.businessCount;
            break;
          case "adAccountCount":
            aVal = a.adAccountCount;
            bVal = b.adAccountCount;
            break;
          case "joinDate":
            aVal = new Date(a.joinDate).getTime();
            bVal = new Date(b.joinDate).getTime();
            break;
          case "lastActivity":
            aVal = new Date(a.lastActivity).getTime();
            bVal = new Date(b.lastActivity).getTime();
            break;
          case "balance":
            aVal = a.balance;
            bVal = b.balance;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [allClients, debouncedTerm, statusFilter, tierFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = allClients.length;
    const active = allClients.filter(c => c.status === 'active').length;
    const suspended = allClients.filter(c => c.status === 'suspended').length;
    const pending = allClients.filter(c => c.status === 'pending').length;
    
    const totalSpend = allClients.reduce((sum, c) => sum + c.totalSpend, 0);
    const totalMonthlySpend = allClients.reduce((sum, c) => sum + c.monthlySpend, 0);
    const totalBusinesses = allClients.reduce((sum, c) => sum + c.businessCount, 0);
    const totalAdAccounts = allClients.reduce((sum, c) => sum + c.adAccountCount, 0);
    const totalBalance = allClients.reduce((sum, c) => sum + c.balance, 0);
    
    const avgSpendPerClient = Math.round(totalSpend / total);
    const avgMonthlySpendPerClient = Math.round(totalMonthlySpend / total);
    
    const byTier = allClients.reduce((acc, c) => {
      acc[c.tier] = (acc[c.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      active,
      suspended,
      pending,
      totalSpend,
      totalMonthlySpend,
      totalBusinesses,
      totalAdAccounts,
      totalBalance,
      avgSpendPerClient,
      avgMonthlySpendPerClient,
      byTier
    };
  }, [allClients]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: "bg-blue-100 text-blue-800",
      professional: "bg-purple-100 text-purple-800",
      enterprise: "bg-gold-100 text-gold-800"
    };
    
    return <Badge className={colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>;
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

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orgs</p>
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
                <p className="text-sm font-medium text-muted-foreground">Businesses</p>
                <p className="text-2xl font-bold">{stats.totalBusinesses.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search organizations..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
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
                <SelectItem value="joinDate">Join Date</SelectItem>
                <SelectItem value="lastActivity">Last Activity</SelectItem>
                <SelectItem value="businessCount">Business Count</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length.toLocaleString()} of {stats.total.toLocaleString()} organizations
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

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Organization</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Tier</th>
                  <th className="text-left p-4 font-medium">Businesses</th>
                  <th className="text-left p-4 font-medium">Total Spend</th>
                  <th className="text-left p-4 font-medium">Balance</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-left p-4 font-medium">Last Activity</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((client) => (
                  <React.Fragment key={client.id}>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-blue-600">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.company}</div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(client.status)}</td>
                      <td className="p-4">{getTierBadge(client.tier)}</td>
                      <td className="p-4">
                        <div className="text-center">
                          <div className="font-medium">{client.businessCount}</div>
                          <div className="text-xs text-gray-500">{client.adAccountCount} accounts</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{formatCurrency(client.totalSpend)}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(client.monthlySpend)}/mo</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`font-medium ${client.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(client.balance)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">{formatDate(client.joinDate)}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">{formatDate(client.lastActivity)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/businesses?organizationId=${client.id}`}>
                              <Building2 className="h-4 w-4 mr-1" />
                              Businesses
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
                                <Mail className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Finances
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 