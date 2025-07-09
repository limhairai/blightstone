import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

interface Transaction {
  id: string;
  clientName: string;
  type: 'deposit' | 'withdrawal' | 'spend' | 'refund' | 'fee';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  date: string;
  description: string;
  reference?: string;
}

interface ClientBalance {
  clientId: string;
  clientName: string;
  balance: number;
  currency: string;
  creditLimit: number;
  totalSpend: number;
  monthlySpend: number;
  lastTransaction: string;
  status: 'active' | 'suspended' | 'overdue';
  paymentMethod: string;
  alerts: number;
}

interface OptimizedBillingViewProps {
  transactions: Transaction[];
  clientBalances: ClientBalance[];
  loading?: boolean;
}

type ViewMode = 'transactions' | 'balances' | 'overview';
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

export function OptimizedBillingView({ 
  transactions, 
  clientBalances, 
  loading = false 
}: OptimizedBillingViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const { searchTerm, debouncedTerm, setSearchTerm } = useDebouncedSearch();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active': 
        return <CheckCircle className="h-3 w-3 text-[#34D197]" />;
      case 'pending': 
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
      case 'suspended':
      case 'overdue': 
        return <XCircle className="h-3 w-3 text-red-600" />;
      default: 
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Compact transaction row - 3x more dense than current UI
  const CompactTransactionRow = ({ tx }: { tx: Transaction }) => (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 hover:bg-muted/30 text-xs">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input type="checkbox" className="h-3 w-3" />
        {getStatusIcon(tx.status)}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{tx.clientName}</div>
          <div className="text-muted-foreground truncate text-xs">{tx.description}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="text-right">
                          <div className={`font-medium ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-[#34D197] dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
          </div>
          <div className="text-muted-foreground text-xs">
            {new Date(tx.date).toLocaleDateString()}
          </div>
        </div>
        
        <Badge 
          variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
          className="h-4 text-xs px-1"
        >
          {tx.status}
        </Badge>
        
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Ultra-compact controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overview')}
            className="h-7 px-2 text-xs"
          >
            Overview
          </Button>
          <Button
            variant={viewMode === 'balances' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('balances')}
            className="h-7 px-2 text-xs"
          >
            Balances
          </Button>
          <Button
            variant={viewMode === 'transactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('transactions')}
            className="h-7 px-2 text-xs"
          >
            Transactions
          </Button>
        </div>
      </div>

      {/* Ultra-compact summary - 6 metrics in one row */}
      <div className="grid grid-cols-6 gap-2 text-xs">
        <Card className="p-2">
          <div className="text-center">
                            <div className="text-sm font-bold text-[#34D197] dark:text-green-400">$2.4M</div>
            <div className="text-muted-foreground text-xs">Balance</div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-sm font-bold">$890K</div>
            <div className="text-muted-foreground text-xs">Monthly</div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-sm font-bold">1,247</div>
            <div className="text-muted-foreground text-xs">Clients</div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-sm font-bold text-[#34D197]">1,198</div>
            <div className="text-muted-foreground text-xs">Active</div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-sm font-bold text-red-600">23</div>
            <div className="text-muted-foreground text-xs">Overdue</div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="text-center">
            <div className="text-sm font-bold">156</div>
            <div className="text-muted-foreground text-xs">24h Txns</div>
          </div>
        </Card>
      </div>

      {/* High-density data table */}
      <Card>
        <CardHeader className="pb-1 pt-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Recent Transactions (showing 50 of 12,847)
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Virtual scrolling container for 1000+ items */}
          <div className="max-h-80 overflow-auto">
            {/* Sample high-density rows */}
            {Array.from({ length: 50 }).map((_, i) => (
              <CompactTransactionRow 
                key={i}
                tx={{
                  id: `tx-${i}`,
                  clientName: `Client ${String.fromCharCode(65 + (i % 26))}`,
                  type: ['deposit', 'withdrawal', 'spend'][i % 3] as any,
                  amount: 2500 + (i * 100), // Incremental amounts
                  currency: 'USD',
                  status: ['completed', 'pending', 'failed'][i % 3] as any,
                  date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(), // Daily intervals
                  description: `Transaction ${i + 1} - Ad spend payment`
                }}
              />
            ))}
          </div>
          
          {/* Pagination info */}
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground">
            <span>Showing 1-50 of 12,847 transactions</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Previous</Button>
              <span className="px-2">Page 1 of 257</span>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 