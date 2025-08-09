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
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  GitBranch,
  Zap,
  Target,
  Timer,
  BarChart3,
  TrendingUp,
  AlertCircle
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
interface AppWorkflow {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  runsCount: number;
  successRate: number;
  avgDuration: number;
  [key: string]: any;
}

interface AppWorkflowRun {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  [key: string]: any;
}

export default function WorkflowPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // TODO: Replace with real admin data service
  const allWorkflows: AppWorkflow[] = [];
  const allWorkflowRuns: AppWorkflowRun[] = [];

  // Enhanced workflow data with metrics
  const enhancedWorkflows = useMemo(() => {
    return allWorkflows.map(workflow => {
      const recentRuns = allWorkflowRuns
        .filter(run => run.workflowId === workflow.id)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 10);

      const successfulRuns = recentRuns.filter(run => run.status === 'completed').length;
      const failedRuns = recentRuns.filter(run => run.status === 'failed').length;
      const currentSuccessRate = recentRuns.length > 0 ? (successfulRuns / recentRuns.length) * 100 : 0;

      return {
        ...workflow,
        recentRuns,
        currentSuccessRate,
        failedRuns,
        isHealthy: currentSuccessRate >= 90 && failedRuns <= 1,
        lastError: recentRuns.find(run => run.status === 'failed')?.error,
        avgExecutionTime: recentRuns
          .filter(run => run.duration)
          .reduce((sum, run) => sum + (run.duration || 0), 0) / Math.max(recentRuns.length, 1)
      };
    });
  }, [allWorkflows, allWorkflowRuns]);

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    return enhancedWorkflows
      .filter(workflow => {
        const matchesSearch = !debouncedTerm || 
          workflow.name.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          workflow.type.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || workflow.status === statusFilter;
        const matchesType = typeFilter === "all" || workflow.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
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
          case "successRate":
            aVal = a.currentSuccessRate;
            bVal = b.currentSuccessRate;
            break;
          case "lastRun":
            aVal = a.lastRun ? new Date(a.lastRun).getTime() : 0;
            bVal = b.lastRun ? new Date(b.lastRun).getTime() : 0;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [enhancedWorkflows, debouncedTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Workflow statistics
  const stats = useMemo(() => {
    const total = allWorkflows.length;
    const active = allWorkflows.filter(w => w.status === 'active').length;
    const paused = allWorkflows.filter(w => w.status === 'paused').length;
    const failed = allWorkflows.filter(w => w.status === 'failed').length;
    
    const totalRuns = allWorkflows.reduce((sum, w) => sum + w.runsCount, 0);
    const avgSuccessRate = total > 0 
      ? allWorkflows.reduce((sum, w) => sum + w.successRate, 0) / total 
      : 0;
    
    const healthyWorkflows = enhancedWorkflows.filter(w => w.isHealthy).length;
    const unhealthyWorkflows = enhancedWorkflows.filter(w => !w.isHealthy).length;
    
    const avgExecutionTime = enhancedWorkflows.length > 0
      ? enhancedWorkflows.reduce((sum, w) => sum + w.avgExecutionTime, 0) / enhancedWorkflows.length
      : 0;
    
    return {
      total,
      active,
      paused,
      failed,
      totalRuns,
      avgSuccessRate,
      healthyWorkflows,
      unhealthyWorkflows,
      avgExecutionTime
    };
  }, [allWorkflows, enhancedWorkflows]);

  // Get unique workflow types for filter
  const workflowTypes = useMemo(() => {
    return [...new Set(allWorkflows.map(w => w.type))].sort();
  }, [allWorkflows]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-foreground">Active</Badge>;
      case "paused":
        return <Badge className="bg-muted text-muted-foreground">Paused</Badge>;
      case "failed":
        return <Badge className="bg-muted text-muted-foreground">Failed</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "automation":
        return <Badge className="bg-secondary text-foreground">Automation</Badge>;
      case "notification":
        return <Badge className="bg-secondary text-foreground">Notification</Badge>;
      case "integration":
        return <Badge className="bg-muted text-muted-foreground">Integration</Badge>;
      case "maintenance":
        return <Badge className="bg-indigo-100 text-indigo-800">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getHealthBadge = (isHealthy: boolean, successRate: number) => {
    if (isHealthy) {
      return <Badge className="bg-secondary text-foreground">Healthy</Badge>;
    } else if (successRate >= 70) {
      return <Badge className="bg-muted text-muted-foreground">Warning</Badge>;
    } else {
      return <Badge className="bg-muted text-muted-foreground">Critical</Badge>;
    }
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
    return `${Math.round(milliseconds / 60000)}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Workflow Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-foreground" />
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
                <Play className="h-6 w-6 text-[#34D197]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.avgSuccessRate.toFixed(1)}%</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{stats.totalRuns.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Activity className="h-6 w-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-[#34D197]">{stats.healthyWorkflows}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(stats.avgExecutionTime)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Timer className="h-6 w-6 text-foreground" />
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
                  placeholder="Search workflows..."
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
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {workflowTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
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
                <SelectItem value="successRate">Success Rate</SelectItem>
                <SelectItem value="lastRun">Last Run</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredWorkflows.length.toLocaleString()} of {stats.total.toLocaleString()} workflows
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

      {/* Workflows Table */}
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workflows available</p>
            <p className="text-sm">Connect your admin data service to view workflow data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 