import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  Building2, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  Grid,
  List as ListIcon,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

interface BusinessManager {
  id: string;
  name: string;
  clientName: string;
  status: 'active' | 'restricted' | 'suspended';
  adAccountCount: number;
  totalSpend: number;
  lastActivity: string;
  alerts: number;
}

interface AdAccount {
  id: string;
  name: string;
  businessManagerId: string;
  clientName: string;
  status: 'active' | 'banned' | 'restricted' | 'pending';
  spend: number;
  limit: number;
  utilization: number;
  lastActivity: string;
}

interface DenseInfrastructureViewProps {
  businessManagers: BusinessManager[];
  adAccounts: AdAccount[];
  loading?: boolean;
}

type ViewMode = 'grid' | 'list' | 'compact';
type GroupBy = 'none' | 'client' | 'status';

export function DenseInfrastructureView({ 
  businessManagers, 
  adAccounts, 
  loading = false 
}: DenseInfrastructureViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [groupBy, setGroupBy] = useState<GroupBy>('client');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const { searchTerm, debouncedTerm, setSearchTerm } = useDebouncedSearch();

  // Filter and group data
  const filteredData = useMemo(() => {
    let filtered = businessManagers.filter(bm => {
      const matchesSearch = bm.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
                           bm.clientName.toLowerCase().includes(debouncedTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bm.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Group data
    if (groupBy === 'client') {
      const grouped = filtered.reduce((acc, bm) => {
        if (!acc[bm.clientName]) acc[bm.clientName] = [];
        acc[bm.clientName].push(bm);
        return acc;
      }, {} as Record<string, BusinessManager[]>);
      return grouped;
    }

    return { 'All': filtered };
  }, [businessManagers, debouncedTerm, statusFilter, groupBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3 text-[#34D197]" />;
      case 'restricted': return <AlertTriangle className="h-3 w-3 text-muted-foreground" />;
      case 'suspended': return <XCircle className="h-3 w-3 text-muted-foreground" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // Compact row component for high density
  const CompactBMRow = ({ bm, style }: { bm: BusinessManager; style?: React.CSSProperties }) => (
    <div 
      style={style}
      className="flex items-center justify-between px-3 py-2 border-b border-border/50 hover:bg-muted/30 text-xs"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input 
          type="checkbox" 
          className="h-3 w-3"
          checked={selectedItems.has(bm.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedItems);
            if (e.target.checked) {
              newSelected.add(bm.id);
            } else {
              newSelected.delete(bm.id);
            }
            setSelectedItems(newSelected);
          }}
        />
        {getStatusIcon(bm.status)}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{bm.name}</div>
          <div className="text-muted-foreground truncate">{bm.clientName}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 text-xs">
        <div className="text-center">
          <div className="font-medium">{bm.adAccountCount}</div>
          <div className="text-muted-foreground">accounts</div>
        </div>
        
        <div className="text-center">
          <div className="font-medium">${(bm.totalSpend / 1000).toFixed(1)}k</div>
          <div className="text-muted-foreground">spend</div>
        </div>
        
        {bm.alerts > 0 && (
          <Badge variant="destructive" className="h-4 text-xs px-1">
            {bm.alerts}
          </Badge>
        )}
        
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  // Grid card component for overview
  const GridBMCard = ({ bm }: { bm: BusinessManager }) => (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(bm.status)}
          <div>
            <div className="font-medium text-sm truncate">{bm.name}</div>
            <div className="text-xs text-muted-foreground truncate">{bm.clientName}</div>
          </div>
        </div>
        {bm.alerts > 0 && (
          <Badge variant="destructive" className="h-4 text-xs">
            {bm.alerts}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium">{bm.adAccountCount}</div>
          <div className="text-muted-foreground">accounts</div>
        </div>
        <div className="text-center">
          <div className="font-medium">${(bm.totalSpend / 1000).toFixed(1)}k</div>
          <div className="text-muted-foreground">spend</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Enhanced Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients, business managers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="client">By Client</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compact')}
            className="h-8 px-2"
          >
            <ListIcon className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-2"
          >
            <Grid className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-border rounded-lg">
          <span className="text-sm font-medium">{selectedItems.size} selected</span>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Bulk Update Status
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Export Selected
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Generate Report
          </Button>
        </div>
      )}

      {/* Data Display */}
      <div className="space-y-4">
        {Object.entries(filteredData).map(([groupName, items]) => (
          <Card key={groupName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {groupName} ({items.length})
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{items.filter(bm => bm.status === 'active').length} active</span>
                  <span>•</span>
                  <span>{items.filter(bm => bm.alerts > 0).length} with alerts</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === 'compact' ? (
                <div className="max-h-96 overflow-auto">
                  {items.map((bm) => (
                    <CompactBMRow key={bm.id} bm={bm} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
                  {items.map((bm) => (
                    <GridBMCard key={bm.id} bm={bm} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold">{businessManagers.length}</div>
            <div className="text-muted-foreground">Total BMs</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[#34D197]">
              {businessManagers.filter(bm => bm.status === 'active').length}
            </div>
            <div className="text-muted-foreground">Active</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-muted-foreground">
              {businessManagers.filter(bm => bm.alerts > 0).length}
            </div>
            <div className="text-muted-foreground">With Alerts</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold">
              ${(businessManagers.reduce((sum, bm) => sum + bm.totalSpend, 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground">Total Spend</div>
          </div>
        </Card>
      </div>
    </div>
  );
} 