"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Progress } from "../../../components/ui/progress";
import { Input } from "../../../components/ui/input";
import { 
  Monitor,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  Activity,
  Target,
  Shield,
  ChevronRight,
  User,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  Eye,
  Settings
} from "lucide-react";
import { APP_PROFILE_TEAMS, APP_TEAM_BUSINESS_MANAGERS, ProfileTeam, TeamBusinessManager } from "../../../lib/mock-data";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export default function InfrastructureMonitoringPage() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    return APP_PROFILE_TEAMS.map(team => {
      const teamBMs = APP_TEAM_BUSINESS_MANAGERS.filter(bm => bm.assignedTeamId === team.id);
      const totalAdAccounts = teamBMs.reduce((sum, bm) => sum + bm.currentAdAccounts, 0);
      const totalSpend = teamBMs.reduce((sum, bm) => sum + bm.monthlySpend, 0);
      const totalAlerts = teamBMs.reduce((sum, bm) => sum + bm.alerts, 0);
      const healthyBMs = teamBMs.filter(bm => bm.healthStatus === 'healthy').length;
      const activeBMs = teamBMs.filter(bm => bm.status === 'active').length;
      
      return {
        ...team,
        businessManagers: teamBMs,
        totalAdAccounts,
        totalSpend,
        totalAlerts,
        healthyBMs,
        activeBMs,
        utilizationPercent: (team.currentBusinessManagers / team.maxBusinessManagers) * 100
      };
    });
  }, []);

  // Filter teams based on search and status
  const filteredTeams = useMemo(() => {
    return teamMetrics.filter(team => {
      const matchesSearch = !searchTerm || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.businessManagers.some(bm => 
          bm.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bm.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "full" && team.status === 'full') ||
        (statusFilter === "active" && team.status === 'active') ||
        (statusFilter === "alerts" && team.totalAlerts > 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [teamMetrics, searchTerm, statusFilter]);

  // Overall system metrics
  const systemMetrics = useMemo(() => {
    const totalTeams = APP_PROFILE_TEAMS.length;
    const activeTeams = APP_PROFILE_TEAMS.filter(t => t.status === 'active').length;
    const totalBMs = APP_TEAM_BUSINESS_MANAGERS.length;
    const totalAdAccounts = APP_TEAM_BUSINESS_MANAGERS.reduce((sum, bm) => sum + bm.currentAdAccounts, 0);
    const totalAlerts = APP_TEAM_BUSINESS_MANAGERS.reduce((sum, bm) => sum + bm.alerts, 0);
    const healthyBMs = APP_TEAM_BUSINESS_MANAGERS.filter(bm => bm.healthStatus === 'healthy').length;
    const totalCapacity = APP_PROFILE_TEAMS.length * 20;
    const utilizationPercent = (totalBMs / totalCapacity) * 100;
    
    return {
      totalTeams,
      activeTeams,
      totalBMs,
      totalAdAccounts,
      totalAlerts,
      healthyBMs,
      totalCapacity,
      utilizationPercent
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'restricted': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'flagged': return <Shield className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProfileStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-3 w-3 text-green-600" />;
      case 'banned': return <UserX className="h-3 w-3 text-red-600" />;
      case 'maintenance': return <Settings className="h-3 w-3 text-yellow-600" />;
      default: return <User className="h-3 w-3 text-gray-400" />;
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Infrastructure Monitoring</h1>
          <p className="text-muted-foreground">Monitor profile teams, capacity, and system health</p>
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

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold">{systemMetrics.activeTeams}/{systemMetrics.totalTeams}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">BM Utilization</p>
                <p className="text-2xl font-bold">{systemMetrics.utilizationPercent.toFixed(1)}%</p>
                <div className="mt-2">
                  <Progress value={systemMetrics.utilizationPercent} className="h-2" />
                </div>
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
                <p className="text-2xl font-bold">{systemMetrics.totalAdAccounts.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">
                  {((systemMetrics.healthyBMs / systemMetrics.totalBMs) * 100).toFixed(1)}%
                </p>
                {systemMetrics.totalAlerts > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {systemMetrics.totalAlerts} alerts
                  </Badge>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, clients, or business managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="full">At Capacity</SelectItem>
                <SelectItem value="alerts">With Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {team.status === 'full' && (
                    <Badge variant="secondary" className="text-xs">FULL</Badge>
                  )}
                  {team.totalAlerts > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {team.totalAlerts}
                    </Badge>
                  )}
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                    selectedTeam === team.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Capacity Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">BM Capacity</span>
                  <span className="text-muted-foreground">
                    {team.currentBusinessManagers}/{team.maxBusinessManagers}
                  </span>
                </div>
                <Progress value={team.utilizationPercent} className="h-2" />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold">{team.totalAdAccounts}</div>
                  <div className="text-xs text-muted-foreground">Ad Accounts</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold">{formatCurrency(team.totalSpend)}</div>
                  <div className="text-xs text-muted-foreground">Monthly Spend</div>
                </div>
              </div>

              {/* Profile Status */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Profiles</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {getProfileStatusIcon(team.mainProfile.status)}
                    <span className="font-medium">Main:</span>
                    <span className="text-muted-foreground">{team.mainProfile.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {getProfileStatusIcon(team.backupProfiles[0].status)}
                    <span className="font-medium">Backup 1:</span>
                    <span className="text-muted-foreground">{team.backupProfiles[0].name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {getProfileStatusIcon(team.backupProfiles[1].status)}
                    <span className="font-medium">Backup 2:</span>
                    <span className="text-muted-foreground">{team.backupProfiles[1].name}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Business Managers */}
              {selectedTeam === team.id && team.businessManagers.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="text-sm font-medium">Business Managers ({team.businessManagers.length})</div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {team.businessManagers.map((bm) => (
                      <div key={bm.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(bm.status)}
                          <div>
                            <div className="font-medium text-sm">{bm.name}</div>
                            <div className="text-xs text-muted-foreground">{bm.clientName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{bm.currentAdAccounts}/6</div>
                          <div className="text-xs text-muted-foreground">accounts</div>
                          {bm.alerts > 0 && (
                            <Badge variant="destructive" className="h-4 text-xs mt-1">
                              {bm.alerts}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Alerts */}
      {systemMetrics.totalAlerts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({systemMetrics.totalAlerts})
            </CardTitle>
            <CardDescription>
              Issues requiring attention across your infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {APP_TEAM_BUSINESS_MANAGERS
                .filter(bm => bm.alerts > 0)
                .slice(0, 5)
                .map((bm) => (
                  <Alert key={bm.id} className="border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <strong>{bm.name}</strong> ({bm.clientName}) - {bm.alerts} issue(s) detected
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 