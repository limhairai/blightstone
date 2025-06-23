"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  Search,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  LinkIcon,
  Users,
  Shield,
  Loader2,
  Building2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { AssetBindingDialog } from "../../../components/admin/asset-binding-dialog";
import { toast } from "sonner";

interface DolphinAsset {
  id: string;
  asset_type: 'business_manager' | 'ad_account' | 'profile';
  facebook_id: string;
  name: string;
  status: 'active' | 'restricted' | 'suspended';
  health_status: 'healthy' | 'warning' | 'critical';
  parent_business_manager_id?: string;
  discovered_at: string;
  last_sync_at?: string;
  asset_metadata?: any;
}

interface AssetStats {
  totalBusinessManagers: number;
  totalAdAccounts: number;
  unassignedBusinessManagers: number;
  unassignedAdAccounts: number;
  lastSyncTime?: string;
}

export default function AssetsPage() {
  const [businessManagers, setBusinessManagers] = useState<DolphinAsset[]>([]);
  const [adAccounts, setAdAccounts] = useState<DolphinAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<AssetStats>({
    totalBusinessManagers: 0,
    totalAdAccounts: 0,
    unassignedBusinessManagers: 0,
    unassignedAdAccounts: 0
  });
  
  // Asset binding dialog state
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    type: "business-manager" | "ad-account";
    name: string;
    id: string;
  } | null>(null);

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setLoading(true);
      
      // Fetch all assets (both assigned and unassigned)
      const allAssetsResponse = await fetch('/api/admin/assets?assigned=all');
      if (allAssetsResponse.ok) {
        const allData = await allAssetsResponse.json();
        const allAssets = allData.assets || [];
        
        // Separate by type
        const allBusinessManagers = allAssets.filter((asset: DolphinAsset) => asset.asset_type === 'business_manager');
        const allAdAccounts = allAssets.filter((asset: DolphinAsset) => asset.asset_type === 'ad_account');
        
        setBusinessManagers(allBusinessManagers);
        setAdAccounts(allAdAccounts);
        
        // Calculate stats
        const unassignedBMs = allBusinessManagers.filter((bm: DolphinAsset) => !bm.asset_metadata?.assignedBusiness).length;
        const unassignedAds = allAdAccounts.filter((acc: DolphinAsset) => !acc.asset_metadata?.assignedBusiness).length;
        
        setStats({
          totalBusinessManagers: allBusinessManagers.length,
          totalAdAccounts: allAdAccounts.length,
          unassignedBusinessManagers: unassignedBMs,
          unassignedAdAccounts: unassignedAds,
          lastSyncTime: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  // Sync with Dolphin Cloud
  const handleSync = async () => {
    try {
      setSyncing(true);
      toast.info('Syncing with Dolphin Cloud...');
      
      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'discover' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Sync failed');
      }
      
      const result = await response.json();
      toast.success(`Sync complete! Discovered ${result.discovered} new assets, updated ${result.updated}`);
      
      // Refresh the assets list
      await fetchAssets();
      
    } catch (error) {
      console.error('Error syncing assets:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync with Dolphin Cloud');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const, icon: CheckCircle },
      restricted: { label: "Restricted", variant: "destructive" as const, icon: AlertTriangle },
      suspended: { label: "Suspended", variant: "destructive" as const, icon: AlertTriangle },
      healthy: { label: "Healthy", variant: "default" as const, icon: CheckCircle },
      warning: { label: "Warning", variant: "secondary" as const, icon: AlertTriangle },
      critical: { label: "Critical", variant: "destructive" as const, icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleBindAsset = (type: "business-manager" | "ad-account", id: string) => {
    const asset = type === "business-manager" 
      ? businessManagers.find(bm => bm.id === id)
      : adAccounts.find(acc => acc.id === id);
    
    if (asset) {
      setSelectedAsset({ type, name: asset.name, id });
      setBindingDialogOpen(true);
    }
  };

  const handleAssetBound = async (organizationId: string, businessId?: string) => {
    if (selectedAsset) {
      toast.success(`Successfully bound ${selectedAsset.name} to organization!`);
      // Refresh assets to remove the bound asset from the list
      await fetchAssets();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">
            Manage Facebook Business Managers and Ad Accounts from Dolphin Cloud
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} variant="outline" size="sm" disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync with Dolphin
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Dolphin Cloud
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Managers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinessManagers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unassignedBusinessManagers} unassigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unassignedAdAccounts} unassigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastSyncTime ? formatDate(stats.lastSyncTime) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Dolphin Cloud sync
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinessManagers + stats.totalAdAccounts}</div>
            <p className="text-xs text-muted-foreground">
              All discovered assets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Tables */}
      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unassigned">Unassigned ({businessManagers.filter(bm => !bm.asset_metadata?.assignedBusiness).length + adAccounts.filter(acc => !acc.asset_metadata?.assignedBusiness).length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({businessManagers.filter(bm => bm.asset_metadata?.assignedBusiness).length + adAccounts.filter(acc => acc.asset_metadata?.assignedBusiness).length})</TabsTrigger>
          <TabsTrigger value="issues">Issues (0)</TabsTrigger>
          <TabsTrigger value="all">All Assets ({businessManagers.length + adAccounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Assets</CardTitle>
              <CardDescription>
                Available Facebook assets ready for client binding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="business-managers" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="business-managers">Business Managers ({businessManagers.filter(bm => !bm.asset_metadata?.assignedBusiness).length})</TabsTrigger>
                  <TabsTrigger value="ad-accounts">Ad Accounts ({adAccounts.filter(acc => !acc.asset_metadata?.assignedBusiness).length})</TabsTrigger>
                </TabsList>

                {/* Business Managers Tab */}
                <TabsContent value="business-managers" className="space-y-4">
                  {/* Filters */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search business managers..."
                        className="pl-10"
                      />
                    </div>
                    <Select value="all" onValueChange={(value) => {}}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Business Managers Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business Manager</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Accounts</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Team (Profile Set)</TableHead>
                          <TableHead>Monthly Spend</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessManagers.filter(bm => !bm.asset_metadata?.assignedBusiness).map((bm) => (
                          <TableRow key={bm.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{bm.name}</div>
                                <div className="text-sm text-muted-foreground font-mono">{bm.facebook_id}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(bm.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{bm.asset_metadata?.usedAccounts}/{bm.asset_metadata?.maxAccounts} used</div>
                                <div className="text-muted-foreground">{bm.asset_metadata?.totalAccounts} total</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {bm.asset_metadata?.assignedBusiness ? (
                                <div className="text-sm">
                                  <div className="font-medium">{bm.asset_metadata.assignedBusiness}</div>
                                  <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {bm.asset_metadata?.assignedTeam ? (
                                <div className="text-sm">
                                  <div className="font-medium flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {bm.asset_metadata.assignedTeam}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No Team</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {bm.asset_metadata?.monthlySpend ? formatCurrency(bm.asset_metadata.monthlySpend, bm.asset_metadata.currency) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {bm.last_sync_at ? formatDate(bm.last_sync_at) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBindAsset("business-manager", bm.id)}
                                disabled={bm.status === "restricted"}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {bm.asset_metadata?.assignedBusiness ? "Rebind" : "Bind"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Ad Accounts Tab */}
                <TabsContent value="ad-accounts" className="space-y-4">
                  {/* Filters */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ad accounts..."
                        className="pl-10"
                      />
                    </div>
                    <Select value="all" onValueChange={(value) => {}}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ad Accounts Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Account</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Business Manager</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Team (Profile Set)</TableHead>
                          <TableHead>Monthly Spend</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adAccounts.filter(acc => !acc.asset_metadata?.assignedBusiness).map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{acc.name}</div>
                                <div className="text-sm text-muted-foreground font-mono">{acc.facebook_id}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(acc.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{acc.asset_metadata?.bmName}</div>
                                <div className="text-muted-foreground font-mono">{acc.facebook_id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {acc.asset_metadata?.assignedBusiness ? (
                                <div className="text-sm">
                                  <div className="font-medium">{acc.asset_metadata.assignedBusiness}</div>
                                  <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {acc.asset_metadata?.assignedTeam ? (
                                <div className="text-sm">
                                  <div className="font-medium flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {acc.asset_metadata.assignedTeam}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No Team</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {acc.asset_metadata?.monthlySpend ? formatCurrency(acc.asset_metadata.monthlySpend, acc.asset_metadata.currency) : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Daily: {acc.asset_metadata?.dailyBudget ? formatCurrency(acc.asset_metadata.dailyBudget, acc.asset_metadata.currency) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {acc.last_sync_at ? formatDate(acc.last_sync_at) : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBindAsset("ad-account", acc.id)}
                                disabled={acc.status === "restricted"}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {acc.asset_metadata?.assignedBusiness ? "Rebind" : "Bind"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assigned Assets Tab */}
        <TabsContent value="assigned" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assigned assets..."
                className="pl-10"
              />
            </div>
            <Select value="all" onValueChange={(value) => {}}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Assets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business Manager</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Team (Profile Set)</TableHead>
                  <TableHead>Monthly Spend</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessManagers.filter(bm => bm.asset_metadata?.assignedBusiness).map((bm) => (
                  <TableRow key={bm.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bm.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{bm.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bm.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{bm.asset_metadata?.bmName}</div>
                        <div className="text-muted-foreground font-mono">{bm.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{bm.asset_metadata.assignedBusiness}</div>
                        <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {bm.asset_metadata?.assignedTeam ? (
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {bm.asset_metadata.assignedTeam}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No Team</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {bm.asset_metadata?.monthlySpend ? formatCurrency(bm.asset_metadata.monthlySpend, bm.asset_metadata.currency) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {bm.last_sync_at ? formatDate(bm.last_sync_at) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBindAsset("business-manager", bm.id)}
                        disabled={bm.status === "restricted"}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Rebind
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {adAccounts.filter(acc => acc.asset_metadata?.assignedBusiness).map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{acc.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{acc.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(acc.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{acc.asset_metadata?.bmName}</div>
                        <div className="text-muted-foreground font-mono">{acc.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{acc.asset_metadata.assignedBusiness}</div>
                        <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {acc.asset_metadata?.assignedTeam ? (
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {acc.asset_metadata.assignedTeam}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No Team</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {acc.asset_metadata?.monthlySpend ? formatCurrency(acc.asset_metadata.monthlySpend, acc.asset_metadata.currency) : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Daily: {acc.asset_metadata?.dailyBudget ? formatCurrency(acc.asset_metadata.dailyBudget, acc.asset_metadata.currency) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {acc.last_sync_at ? formatDate(acc.last_sync_at) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBindAsset("ad-account", acc.id)}
                        disabled={acc.status === "restricted"}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Rebind
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-10"
              />
            </div>
            <Select value="all" onValueChange={(value) => {}}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Issues Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Business Manager</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Placeholder for issues table */}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* All Assets Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all assets..."
                className="pl-10"
              />
            </div>
            <Select value="all" onValueChange={(value) => {}}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* All Assets Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business Manager</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Team (Profile Set)</TableHead>
                  <TableHead>Monthly Spend</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessManagers.map((bm) => (
                  <TableRow key={bm.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bm.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{bm.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bm.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{bm.asset_metadata?.bmName}</div>
                        <div className="text-muted-foreground font-mono">{bm.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {bm.asset_metadata?.assignedBusiness ? (
                        <div className="text-sm">
                          <div className="font-medium">{bm.asset_metadata.assignedBusiness}</div>
                          <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {bm.asset_metadata?.assignedTeam ? (
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {bm.asset_metadata.assignedTeam}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No Team</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {bm.asset_metadata?.monthlySpend ? formatCurrency(bm.asset_metadata.monthlySpend, bm.asset_metadata.currency) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {bm.last_sync_at ? formatDate(bm.last_sync_at) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBindAsset("business-manager", bm.id)}
                        disabled={bm.status === "restricted"}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {bm.asset_metadata?.assignedBusiness ? "Rebind" : "Bind"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {adAccounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{acc.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{acc.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(acc.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{acc.asset_metadata?.bmName}</div>
                        <div className="text-muted-foreground font-mono">{acc.facebook_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {acc.asset_metadata?.assignedBusiness ? (
                        <div className="text-sm">
                          <div className="font-medium">{acc.asset_metadata.assignedBusiness}</div>
                          <Badge variant="outline" className="text-xs mt-1">Bound</Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {acc.asset_metadata?.assignedTeam ? (
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {acc.asset_metadata.assignedTeam}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No Team</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {acc.asset_metadata?.monthlySpend ? formatCurrency(acc.asset_metadata.monthlySpend, acc.asset_metadata.currency) : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Daily: {acc.asset_metadata?.dailyBudget ? formatCurrency(acc.asset_metadata.dailyBudget, acc.asset_metadata.currency) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {acc.last_sync_at ? formatDate(acc.last_sync_at) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBindAsset("ad-account", acc.id)}
                        disabled={acc.status === "restricted"}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {acc.asset_metadata?.assignedBusiness ? "Rebind" : "Bind"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Asset Binding Dialog */}
      {bindingDialogOpen && selectedAsset && (
        <AssetBindingDialog
          open={bindingDialogOpen}
          onClose={() => setBindingDialogOpen(false)}
          onBound={handleAssetBound}
          type={selectedAsset.type}
          name={selectedAsset.name}
          id={selectedAsset.id}
        />
      )}
    </div>
  );
}

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}