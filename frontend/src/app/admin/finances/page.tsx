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

// Temporary types until real admin service is implemented
interface AppTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  clientId?: string;
  clientName?: string;
  description?: string;
  reference?: string;
  [key: string]: any;
}

interface AppClient {
  id: string;
  name: string;
  balance: number;
  creditLimit: number;
  [key: string]: any;
}

export default function FinancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [alertsFilter, setAlertsFilter] = useState("all");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // TODO: Replace with real admin data service
  const allTransactions: AppTransaction[] = [];
  const allClients: AppClient[] = [];

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
        creditUtilization: client.balance < 0 ? Math.abs(client.balance) / (client.creditLimit || 1000) * 100 : 0
      };
    });
  }, [allClients, allTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return enhancedTransactions
      .filter(transaction => {
        const matchesSearch = !debouncedTerm || 
          transaction.id.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (transaction.clientName || '').toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (transaction.description || '').toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (transaction.reference || '').toLowerCase().includes(debouncedTerm.toLowerCase());
        
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
            aVal = a.clientName || '';
            bVal = b.clientName || '';
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
      overdueClients
    };
  }, [allTransactions, clientFinancials]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "topup":
        return <Badge className="bg-green-100 text-green-800">Top Up</Badge>;
      case "commission":
        return <Badge className="bg-blue-100 text-blue-800">Commission</Badge>;
      case "fee":
        return <Badge className="bg-purple-100 text-purple-800">Fee</Badge>;
      case "refund":
        return <Badge className="bg-orange-100 text-orange-800">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  return (
    <div className="space-y-6 p-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
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
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskClients}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">{stats.overdueClients}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
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
                  placeholder="Search transactions..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="topup">Top Up</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTransactions.length.toLocaleString()} of {stats.total.toLocaleString()} transactions
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

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions available</p>
            <p className="text-sm">Connect your admin data service to view financial data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 