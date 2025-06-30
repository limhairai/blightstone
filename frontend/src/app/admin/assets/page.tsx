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
import { Loader2, RefreshCw, ExternalLink, AlertCircle, Activity, Users, Building, Search, Link as LinkIcon, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { BindAssetDialog } from "../../../components/admin/BindAssetDialog"
import { ManageAssetDialog } from "../../../components/admin/ManageAssetDialog"
import type { DolphinAsset as BaseDolphinAsset } from '@/services/supabase-service'
import { extractTeamFromProfile, getTeamFromAssetMetadata, getTeamDisplayName, type TeamInfo } from '@/lib/team-utils'

// Extend the base type with properties the frontend needs for display
interface DolphinAsset extends BaseDolphinAsset {
  organization_name?: string;
  business_name?: string;
  organization_id?: string;
  bound_at?: string;
}

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
  const [teamFilter, setTeamFilter] = useState('all')
  const [syncType, setSyncType] = useState('normal')
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/dolphin-assets/all-assets?_t=${timestamp}`)
      if (!response.ok) throw new Error(`Failed to load assets: ${response.statusText}`)
      const data = await response.json()
      
      // Handle both old format (array) and new format ({assets: array})
      const assetsArray = Array.isArray(data) ? data : (data.assets || [])
      setAssets(assetsArray)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
      toast.error("Failed to load assets. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const syncAssets = useCallback(async (forceRefresh = false) => {
    setSyncing(true)
    setError(null)
    try {
      const url = forceRefresh 
        ? '/api/admin/dolphin-assets/sync?force_refresh=true'
        : '/api/admin/dolphin-assets/sync';
      
      const response = await fetch(url, { method: 'POST' });
      
      if (!response.ok) throw new Error('Sync failed');
      const result = await response.json();

      const message = forceRefresh 
        ? `Force Sync Complete: Found ${result.profiles_found} profiles, ${result.business_managers_found} BMs, ${result.ad_accounts_found} ad accounts. Updated ${result.assets_updated} assets.`
        : `Sync Complete: Found ${result.profiles_found} profiles, ${result.business_managers_found} BMs, ${result.ad_accounts_found} ad accounts`;
        
      toast.success(message);
      await loadAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync assets')
      toast.error("Failed to sync assets from Dolphin API.")
    } finally {
      setSyncing(false)
    }
  }, [loadAssets])

  // Future: Handle profile switching (A-Admin-1 → A-Backup-1)
  const handleProfileSwitch = useCallback(async (oldProfile: string, newProfile: string) => {
    // This will be implemented when needed for profile switching
    console.log(`Profile switch requested: ${oldProfile} → ${newProfile}`);
    toast.info("Profile switching will be available when needed for failover scenarios.");
  }, [])

  const handleSync = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await syncAssets(syncType === 'force')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync assets')
      toast.error("Failed to sync assets from Dolphin API.")
    } finally {
      setIsLoading(false)
    }
  }, [syncAssets, syncType])

  const handleDiagnostic = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/dolphin-assets/debug/dolphin-associations')
      if (!response.ok) throw new Error('Diagnostic failed')
      
      const diagnosis = await response.json()
      
      // Store results for display
      setDiagnosticResults(diagnosis)
      setShowDiagnostic(true)
      
      // Show diagnostic results in console for detailed analysis
      console.log('🔍 Dolphin BM Association Diagnosis:', diagnosis)
      
      // Show summary in toast
      const issues = diagnosis.association_issues?.length || 0
      if (issues > 0) {
        toast.error(`Found ${issues} BM association issues. Check the diagnostic panel for details.`)
      } else {
        toast.success('No BM association issues detected!')
      }
      
      // Also log key findings
      if (diagnosis.cross_reference) {
        const { bm_ids_only_in_profiles, bm_ids_only_in_cabs } = diagnosis.cross_reference
        if (bm_ids_only_in_profiles.length > 0) {
          console.log('⚠️ BMs only visible in profiles (permission issue?):', bm_ids_only_in_profiles)
        }
        if (bm_ids_only_in_cabs.length > 0) {
          console.log('⚠️ BMs only visible in CABs (orphaned accounts?):', bm_ids_only_in_cabs)
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostic failed')
      toast.error("Failed to run diagnostic. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const stats = useMemo<AssetStats>(() => ({
    profiles: assets.filter(a => a.type === 'profile').length,
    business_managers: assets.filter(a => a.type === 'business_manager').length,
    ad_accounts: assets.filter(a => a.type === 'ad_account').length
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

  const getAdAccountCount = useCallback((businessManagerAsset: DolphinAsset) => {
    // Count ad accounts that have this business manager as their parent (stored in metadata)
    const count = assets.filter(asset => 
      asset.type === 'ad_account' && 
      asset.metadata?.business_manager_id === businessManagerAsset.dolphin_id
    ).length;
    return count;
  }, [assets]);

  const getBoundTo = useCallback((asset: DolphinAsset) => {
    if (asset.organization_id) {
      // Use organization_name if available, otherwise fall back to organization_id
      return asset.organization_name || asset.organization_id;
    }
    return 'Unbound';
  }, []);

  const getLastSync = useCallback((dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Show exact time for recent syncs
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // For older dates, show the actual date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }, []);

  // Get team information for an asset
  const getAssetTeam = useCallback((asset: DolphinAsset) => {
    if (asset.type === 'profile') {
      const teamInfo = extractTeamFromProfile(asset.name);
      return teamInfo ? getTeamDisplayName(teamInfo.team) : 'Unknown';
    }
    
    // For BMs and Ad Accounts, use the utility function
    const teamLetter = getTeamFromAssetMetadata(asset.metadata);
    return getTeamDisplayName(teamLetter);
  }, []);

  // Get team badge component
  const getTeamBadge = useCallback((asset: DolphinAsset) => {
    const teamText = getAssetTeam(asset);
    const isUnknown = teamText === 'Unknown';
    
    // For profiles, also show role information
    if (asset.type === 'profile') {
      const teamInfo = extractTeamFromProfile(asset.name);
      if (teamInfo) {
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline"
              className="text-blue-700 border-blue-200 bg-blue-50"
            >
              {teamText}
            </Badge>
            <Badge 
              variant={teamInfo.isBackup ? "secondary" : "default"}
              className={teamInfo.isBackup ? "text-orange-700 bg-orange-50" : "text-green-700 bg-green-50"}
            >
              {teamInfo.role}-{teamInfo.instance}
            </Badge>
          </div>
        );
      }
    }
    
    return (
      <Badge 
        variant={isUnknown ? "secondary" : "outline"}
        className={isUnknown ? "text-gray-500" : "text-blue-700 border-blue-200 bg-blue-50"}
      >
        {teamText}
      </Badge>
    );
  }, [getAssetTeam]);

  // Get available teams from assets
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    assets.forEach(asset => {
      const teamText = getAssetTeam(asset);
      if (teamText !== 'Unknown') {
        teams.add(teamText);
      }
    });
    return Array.from(teams).sort();
  }, [assets, getAssetTeam]);

  const filteredAssets = (assetType: string) => assets
    .filter(a => a.type === assetType)
    .filter(a => {
      const matchesSearch = searchTerm === '' || 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.dolphin_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      
      const matchesTeam = teamFilter === 'all' || getAssetTeam(a) === teamFilter;
      
      return matchesSearch && matchesStatus && matchesTeam;
    });

  const renderAssetsTable = (assetList: DolphinAsset[], type: string) => {
    const typeHeaders: { [key: string]: string[] } = {
      profile: ['Team Profile', 'Status', 'Team & Role', 'Last Sync'],
      business_manager: ['Business Manager', 'Status', 'Team', 'Accounts', 'Bound To', 'Last Sync', 'Actions'],
      ad_account: ['Ad Account', 'Status', 'Team', 'Parent BM', 'Bound To', 'Last Sync', 'Actions'],
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
                  <div className="text-sm text-gray-500">{asset.dolphin_id}</div>
                </TableCell>
                <TableCell>{getStatusBadge(asset.status)}</TableCell>
                <TableCell>{getTeamBadge(asset)}</TableCell>
                {type === 'business_manager' && <TableCell>{getAdAccountCount(asset)}</TableCell>}
                {type === 'ad_account' && <TableCell>{(asset.metadata as any)?.business_manager || 'N/A'}</TableCell>}
                {type !== 'profile' && <TableCell><span className={asset.organization_id ? 'text-blue-600 font-medium' : 'text-gray-500'}>{getBoundTo(asset)}</span></TableCell>}
                <TableCell className="text-gray-600">{getLastSync(asset.last_sync_at)}</TableCell>
                {type !== 'profile' && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!asset.organization_id ? <BindAssetDialog asset={asset} onSuccess={loadAssets} /> : <ManageAssetDialog asset={asset} onSuccess={loadAssets} />}
                      <a href={(asset.metadata as any)?.url} target="_blank" rel="noopener noreferrer">
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
  
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2 text-muted-foreground">Loading assets...</span>
    </div>
  );

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dolphin Assets</h1>
        <div className="flex items-center gap-4">
          <Select value={syncType} onValueChange={setSyncType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select sync type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal Sync</SelectItem>
              <SelectItem value="force">Force Refresh</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Assets
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleDiagnostic} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Diagnose BM Issues
          </Button>
        </div>
      </header>

      {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Tabs defaultValue="business_manager">
        <TabsList>
          <TabsTrigger value="business_manager">Business Managers</TabsTrigger>
          <TabsTrigger value="ad_account">Ad Accounts</TabsTrigger>
          <TabsTrigger value="profile">Teams</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Search by name or ID..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Filter by team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {availableTeams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Diagnostic Results Modal */}
      {showDiagnostic && diagnosticResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dolphin BM Association Diagnostic</h2>
              <Button variant="ghost" onClick={() => setShowDiagnostic(false)}>✕</Button>
            </div>
            
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Profiles: {diagnosticResults.summary?.profiles_count || 0}</div>
                  <div>CABs: {diagnosticResults.summary?.cabs_count || 0}</div>
                  <div>Issues: {diagnosticResults.association_issues?.length || 0}</div>
                </div>
              </div>

              {/* Issues */}
              {diagnosticResults.association_issues && diagnosticResults.association_issues.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-red-800">Association Issues ({diagnosticResults.association_issues.length})</h3>
                  <div className="space-y-2">
                    {diagnosticResults.association_issues.map((issue: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="font-medium">{issue.cab_name}</div>
                        <div className="text-sm text-gray-600">ID: {issue.cab_id}</div>
                        <div className="text-sm text-gray-600">Managing: {issue.managing_profiles?.join(', ') || 'None'}</div>
                        <div className="text-sm text-red-600">{issue.issue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross Reference Analysis */}
              {diagnosticResults.cross_reference && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-yellow-800">Cross-Reference Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">BMs only in profiles:</span> {diagnosticResults.cross_reference.bm_ids_only_in_profiles?.length || 0}
                      {diagnosticResults.cross_reference.bm_ids_only_in_profiles?.length > 0 && (
                        <div className="text-yellow-700 ml-4">⚠️ These BMs may have permission issues</div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">BMs only in CABs:</span> {diagnosticResults.cross_reference.bm_ids_only_in_cabs?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Common BMs:</span> {diagnosticResults.cross_reference.common_bm_ids?.length || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {diagnosticResults.recommendations && diagnosticResults.recommendations.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {diagnosticResults.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Profile Analysis Summary */}
              {diagnosticResults.profiles_analysis && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Profile Analysis</h3>
                  <div className="space-y-2">
                    {diagnosticResults.profiles_analysis.map((profile: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{profile.name}</span>
                        <span>{profile.bm_count} BMs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowDiagnostic(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}