'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCw, ExternalLink, AlertCircle, Activity, Users, Building, Search, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { BindAssetDialog } from "../../../components/admin/BindAssetDialog"
import { ManageAssetDialog } from "../../../components/admin/ManageAssetDialog"
import type { DolphinAsset } from '@/services/supabase-service'

interface AssetStats {
  profiles: number
  business_managers: number
  ad_accounts: number
}

export default function AssetsPage() {
  const { session } = useAuth()
  const [assets, setAssets] = useState<DolphinAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/dolphin-assets/all-assets')
      if (!response.ok) throw new Error(`Failed to load assets: ${response.statusText}`)
      const data = await response.json()
      setAssets(data.assets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
      toast.error("Failed to load assets. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const syncAssets = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/dolphin-assets/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      const result = await response.json();

      toast.success(`Sync Complete: Found ${result.profiles_found} profiles, ${result.business_managers_found} BMs, ${result.ad_accounts_found} ad accounts`);
      await loadAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync assets')
      toast.error("Failed to sync assets from Dolphin API.")
    } finally {
      setSyncing(false)
    }
  }, [loadAssets])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const stats = useMemo<AssetStats>(() => ({
    profiles: assets.filter(a => a.asset_type === 'profile').length,
    business_managers: assets.filter(a => a.asset_type === 'business_manager').length,
    ad_accounts: assets.filter(a => a.asset_type === 'ad_account').length
  }), [assets])

  const getStatusBadge = useCallback((status: string) => {
    const statusMap: { [key: string]: { className: string; label: string } } = {
      active: { className: "bg-green-100 text-green-800 border-green-200", label: "Active" },
      connection_error: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Connection Issue" },
      restricted: { className: "bg-orange-100 text-orange-800 border-orange-200", label: "FB Restricted" },
      suspended: { className: "bg-red-100 text-red-800 border-red-200", label: "FB Suspended" },
    };
    const config = statusMap[status] || { className: "", label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  }, []);

  const getBoundTo = useCallback((asset: DolphinAsset) => {
    if (asset.is_bound && asset.binding_info) {
      const { organization_name, business_name } = asset.binding_info;
      return business_name ? `${organization_name} > ${business_name}` : organization_name;
    }
    return 'Unbound';
  }, []);

  const getLastSync = useCallback((dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  }, []);

  const filteredAssets = (assetType: string) => assets
    .filter(a => a.asset_type === assetType)
    .filter(a =>
      (searchTerm === '' || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.asset_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || a.status === statusFilter)
    );

  const renderAssetsTable = (assetList: DolphinAsset[], type: string) => {
    const typeHeaders: { [key: string]: string[] } = {
      profile: ['Profile', 'Status', 'Team', 'Last Sync'],
      business_manager: ['Business Manager', 'Status', 'Accounts', 'Bound To', 'Last Sync', 'Actions'],
      ad_account: ['Ad Account', 'Status', 'Parent BM', 'Bound To', 'Last Sync', 'Actions'],
    };

    return (
      <Table>
        <TableHeader><TableRow>{typeHeaders[type].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {assetList.length === 0 ? (
            <TableRow><TableCell colSpan={typeHeaders[type].length} className="text-center py-8 text-gray-500">No {type.replace(/_/g, ' ')}s found</TableCell></TableRow>
          ) : (
            assetList.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-500">{asset.asset_id}</div>
                </TableCell>
                <TableCell>{getStatusBadge(asset.status)}</TableCell>
                {type === 'profile' && <TableCell>{asset.asset_metadata?.team?.name || 'Unassigned'}</TableCell>}
                {type === 'business_manager' && <TableCell>{asset.asset_metadata?.ad_accounts_count || 0}</TableCell>}
                {type === 'ad_account' && <TableCell>{asset.asset_metadata?.business_manager || 'N/A'}</TableCell>}
                {type !== 'profile' && <TableCell><span className={asset.is_bound ? 'text-blue-600 font-medium' : 'text-gray-500'}>{getBoundTo(asset)}</span></TableCell>}
                <TableCell className="text-gray-600">{getLastSync(asset.last_sync_at)}</TableCell>
                {type !== 'profile' && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!asset.is_bound ? <BindAssetDialog asset={asset} onSuccess={loadAssets} /> : <ManageAssetDialog asset={asset} onSuccess={loadAssets} />}
                      <a href={asset.asset_metadata?.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                      </a>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };
  
  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dolphin Assets</h1>
        <Button onClick={syncAssets} disabled={syncing}>
          {syncing ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Sync with Dolphin</>}
        </Button>
      </header>

      {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Tabs defaultValue="business_manager">
        <TabsList>
          <TabsTrigger value="business_manager">Business Managers</TabsTrigger>
          <TabsTrigger value="ad_account">Ad Accounts</TabsTrigger>
          <TabsTrigger value="profile">Profiles</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Search by name or ID..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="connection_error">Connection Issue</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="business_manager">{renderAssetsTable(filteredAssets('business_manager'), 'business_manager')}</TabsContent>
            <TabsContent value="ad_account">{renderAssetsTable(filteredAssets('ad_account'), 'ad_account')}</TabsContent>
            <TabsContent value="profile">{renderAssetsTable(filteredAssets('profile'), 'profile')}</TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </>
  )
}