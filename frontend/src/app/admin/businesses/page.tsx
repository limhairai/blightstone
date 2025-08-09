"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Star,
  Activity,
  CreditCard,
  Target,
  Zap,
  Shield
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

// Temporary types until real admin service is implemented
interface AppBusiness {
  id: string;
  name: string;
  industry: string;
  status: string;
  createdAt: string;
  ownerId: string;
  ownerName?: string;
  totalSpend: number;
  accountsCount: number;
  lastActivity?: string;
  [key: string]: any;
}

interface AppClient {
  id: string;
  name: string;
  email: string;
  businesses: AppBusiness[];
  totalSpend: number;
  [key: string]: any;
}

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // TODO: Replace with real admin data service
  const allBusinesses: AppBusiness[] = [];
  const allClients: AppClient[] = [];

  // Enhanced business data with metrics
  const enhancedBusinesses = useMemo(() => {
    return allBusinesses.map(business => ({
      ...business,
      healthScore: 85, // Default good health score
      riskLevel: 'low', // Default low risk
      monthlySpend: business.totalSpend * 0.2, // 20% of total spend as monthly average
      growthRate: 15, // Default 15% growth
      activeAccounts: Math.ceil(business.accountsCount * 0.8), // 80% of accounts active
      lastPayment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      complianceScore: 90, // Default good compliance
      supportTickets: 1 // Default minimal tickets
    }));
  }, [allBusinesses]);

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    return enhancedBusinesses
      .filter(business => {
        const matchesSearch = !debouncedTerm || 
          business.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (business.ownerName || '').toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          business.industry.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || business.status === statusFilter;
        const matchesIndustry = industryFilter === "all" || business.industry === industryFilter;
        
        return matchesSearch && matchesStatus && matchesIndustry;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "name":
            aVal = a.name;
            bVal = b.name;
            break;
          case "totalSpend":
            aVal = a.totalSpend;
            bVal = b.totalSpend;
            break;
          case "healthScore":
            aVal = a.healthScore;
            bVal = b.healthScore;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [enhancedBusinesses, debouncedTerm, statusFilter, industryFilter, sortBy, sortOrder]);

  // Business statistics
  const stats = useMemo(() => {
    const total = allBusinesses.length;
    const active = allBusinesses.filter(b => b.status === 'active').length;
    const pending = allBusinesses.filter(b => b.status === 'pending').length;
    const suspended = allBusinesses.filter(b => b.status === 'suspended').length;
    
    const totalSpend = allBusinesses.reduce((sum, b) => sum + b.totalSpend, 0);
    const totalAccounts = allBusinesses.reduce((sum, b) => sum + b.accountsCount, 0);
    
    const avgSpendPerBusiness = total > 0 ? totalSpend / total : 0;
    const avgAccountsPerBusiness = total > 0 ? totalAccounts / total : 0;
    
    const highRiskBusinesses = enhancedBusinesses.filter(b => b.riskLevel === 'high').length;
    const lowHealthBusinesses = enhancedBusinesses.filter(b => b.healthScore < 50).length;
    
    return {
      total,
      active,
      pending,
      suspended,
      totalSpend,
      totalAccounts,
      avgSpendPerBusiness,
      avgAccountsPerBusiness,
      highRiskBusinesses,
      lowHealthBusinesses
    };
  }, [allBusinesses, enhancedBusinesses]);

  // Get unique industries for filter
  const industries = useMemo(() => {
    return [...new Set(allBusinesses.map(b => b.industry))].sort();
  }, [allBusinesses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-foreground">Active</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
      case "suspended":
        return <Badge className="bg-muted text-muted-foreground">Suspended</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge className="bg-muted text-muted-foreground">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-muted text-muted-foreground">Medium Risk</Badge>;
      case "low":
        return <Badge className="bg-secondary text-foreground">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-secondary text-foreground">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-secondary text-foreground">Good</Badge>;
    if (score >= 40) return <Badge className="bg-muted text-muted-foreground">Fair</Badge>;
    return <Badge className="bg-muted text-muted-foreground">Poor</Badge>;
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Business Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-[#34D197]">{stats.active.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-[#34D197]" />
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
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ad Accounts</p>
                <p className="text-2xl font-bold">{stats.totalAccounts.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.highRiskBusinesses}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Health</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.lowHealthBusinesses}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-6 w-6 text-muted-foreground" />
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="totalSpend">Total Spend</SelectItem>
                <SelectItem value="healthScore">Health Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredBusinesses.length.toLocaleString()} of {stats.total.toLocaleString()} businesses
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
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No businesses available</p>
            <p className="text-sm">Connect your admin data service to view business data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 