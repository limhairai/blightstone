"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft,
  Shield,
  Building2,
  Users,
  Search,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ExternalLink,
  Globe,
  Activity,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { VirtualizedTable } from "../../../components/admin/VirtualizedTable";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { useServerPagination } from "../../../hooks/useServerPagination";
import { adminMockData, MockInventoryItem } from "../../../lib/mock-data/admin-mock-data";
import { MOCK_PROFILE_TEAMS, MOCK_TEAM_BUSINESS_MANAGERS } from "../../../lib/mock-data";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastChecked");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all inventory data - filter to only business managers
  const allInventory = adminMockData.getInventory().filter(item => item.type === 'business_manager');

  // Filter and sort data
  const filteredData = useMemo(() => {
    return allInventory
      .filter(item => {
        const matchesSearch = !debouncedTerm || 
          item.id.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          (item.assignedTo && item.assignedTo.toLowerCase().includes(debouncedTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "id":
            aVal = a.id;
            bVal = b.id;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          case "lastChecked":
            aVal = new Date(a.lastChecked).getTime();
            bVal = new Date(b.lastChecked).getTime();
            break;
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [allInventory, debouncedTerm, statusFilter, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allInventory.length;
    const available = allInventory.filter(item => item.status === 'available').length;
    const assigned = allInventory.filter(item => item.status === 'assigned').length;
    const suspended = allInventory.filter(item => item.status === 'suspended').length;

    return {
      total,
      available,
      assigned,
      suspended
    };
  }, [allInventory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Helper function to get team information for a business manager
  const getTeamInfo = (bmId: string) => {
    const teamBM = MOCK_TEAM_BUSINESS_MANAGERS.find(bm => bm.fbBmId === bmId);
    if (teamBM) {
      const team = MOCK_PROFILE_TEAMS.find(t => t.id === teamBM.assignedTeamId);
      return {
        teamName: team?.name || 'Unknown Team',
        teamId: team?.id || '',
        mainProfile: team?.mainProfile.name || 'Unknown'
      };
    }
    return null;
  };

  // Virtualized table columns
  const columns = [
    {
      key: "id",
      header: "ID",
      width: 120,
      render: (item: MockInventoryItem) => (
        <div className="font-mono text-sm">{item.id}</div>
      )
    },
    {
      key: "status",
      header: "Status",
      width: 120,
      render: (item: MockInventoryItem) => getStatusBadge(item.status)
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      width: 150,
      render: (item: MockInventoryItem) => (
        <div className="text-sm">
          {item.assignedTo ? (
            <div>
              <div className="font-medium">{item.assignedTo}</div>
              <div className="text-xs text-muted-foreground">
                {item.assignedAt ? formatDate(item.assignedAt) : ''}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </div>
      )
    },
    {
      key: "team",
      header: "Team",
      width: 120,
      render: (item: MockInventoryItem) => {
        const teamInfo = getTeamInfo(item.metadata.accountId);
        return (
          <div className="text-sm">
            {teamInfo ? (
              <div>
                <div className="font-medium text-blue-600">{teamInfo.teamName}</div>
                <div className="text-xs text-muted-foreground">{teamInfo.mainProfile}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">No team</span>
            )}
          </div>
        );
      }
    },
    {
      key: "lastChecked",
      header: "Last Checked",
      width: 120,
      render: (item: MockInventoryItem) => (
        <div className="text-sm">{formatDate(item.lastChecked)}</div>
      )
    },
    {
      key: "details",
      header: "Details",
      width: 200,
      render: (item: MockInventoryItem) => (
        <div className="text-sm">
          <div>ID: {item.metadata.accountId}</div>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: 80,
      render: (item: MockInventoryItem) => (
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
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Meta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Manager Inventory</h1>
          <p className="text-muted-foreground">Manage business manager assignments and team allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total BMs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
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
                  placeholder="Search business managers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastChecked">Last Checked</SelectItem>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {stats.total} business managers
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

      {/* Inventory Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <VirtualizedTable
            data={filteredData}
            columns={columns}
            height={600}
            itemHeight={60}
          />
        </CardContent>
      </Card>
    </div>
  );
}