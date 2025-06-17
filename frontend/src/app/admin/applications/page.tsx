"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { 
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { VirtualizedTable } from "../../../components/admin/VirtualizedTable";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { adminMockData } from "../../../lib/mock-data/admin-mock-data";
import { MOCK_PROFILE_TEAMS } from "../../../lib/mock-data";

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { debouncedTerm } = useDebouncedSearch(searchTerm, 300);

  // Get all applications
  const allApplications = adminMockData.getApplications();

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return allApplications
      .filter(application => {
        const matchesSearch = !debouncedTerm || 
          application.id.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          application.clientName.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
          application.businessName.toLowerCase().includes(debouncedTerm.toLowerCase());
        
        const matchesStage = stageFilter === "all" || application.stage === stageFilter;
        const matchesType = typeFilter === "all" || application.type === typeFilter;
        const matchesPriority = priorityFilter === "all" || application.priority === priorityFilter;
        
        return matchesSearch && matchesStage && matchesType && matchesPriority;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case "createdAt":
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case "client":
            aVal = a.clientName;
            bVal = b.clientName;
            break;
          case "stage":
            aVal = a.stage;
            bVal = b.stage;
            break;
          case "priority":
            aVal = a.priority;
            bVal = b.priority;
            break;
          default:
            return 0;
        }
        
        if (typeof aVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [allApplications, debouncedTerm, stageFilter, typeFilter, priorityFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = allApplications.length;
    const approved = allApplications.filter(a => a.stage === 'approved').length;
    const rejected = allApplications.filter(a => a.stage === 'rejected').length;
    const pending = allApplications.filter(a => 
      a.stage === 'received' || a.stage === 'document_prep' || a.stage === 'submitted' || a.stage === 'under_review'
    ).length;
    const highPriority = allApplications.filter(a => a.priority === 'high' || a.priority === 'urgent').length;
    
    return { total, approved, rejected, pending, highPriority };
  }, [allApplications]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "submitted":
        return "bg-purple-100 text-purple-800";
      case "document_prep":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  // Helper function to get available teams for assignment
  const getAvailableTeams = () => {
    return MOCK_PROFILE_TEAMS.filter(team => team.status === 'active' && team.currentBusinessManagers < team.maxBusinessManagers);
  };

  // Helper function to get team with most capacity
  const getRecommendedTeam = () => {
    const availableTeams = getAvailableTeams();
    if (availableTeams.length === 0) return null;
    
    return availableTeams.reduce((best, current) => {
      const bestCapacity = best.maxBusinessManagers - best.currentBusinessManagers;
      const currentCapacity = current.maxBusinessManagers - current.currentBusinessManagers;
      return currentCapacity > bestCapacity ? current : best;
    });
  };

  // Virtualized table columns
  const columns = [
    {
      key: "id",
      header: "Application ID",
      width: 120,
      render: (application: any) => (
        <div className="font-mono text-sm">{application.id}</div>
      )
    },
    {
      key: "client",
      header: "Client",
      width: 180,
      render: (application: any) => (
        <div>
          <div className="font-medium">{application.clientName}</div>
          <div className="text-sm text-muted-foreground">{application.businessName}</div>
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      width: 140,
      render: (application: any) => (
        <Badge variant="outline" className="text-xs">
          {application.type.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: "stage",
      header: "Stage",
      width: 120,
      render: (application: any) => (
        <Badge className={getStageColor(application.stage)}>
          {application.stage.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: "priority",
      header: "Priority",
      width: 100,
      render: (application: any) => (
        <Badge className={getPriorityColor(application.priority)}>
          {application.priority}
        </Badge>
      )
    },
    {
      key: "created",
      header: "Created",
      width: 120,
      render: (application: any) => (
        <div className="text-sm">{formatDate(application.createdAt)}</div>
      )
    },
    {
      key: "updated",
      header: "Last Updated",
      width: 120,
      render: (application: any) => (
        <div className="text-sm">{formatDate(application.lastUpdated)}</div>
      )
    },
    {
      key: "team",
      header: "Assigned Team",
      width: 140,
      render: (application: any) => {
        // Only show team assignment for business applications
        if (application.type !== 'new_business') {
          return <span className="text-muted-foreground text-xs">N/A</span>;
        }
        
        const recommendedTeam = getRecommendedTeam();
        const availableTeams = getAvailableTeams();
        
        return (
          <div className="text-sm">
            {recommendedTeam ? (
              <div>
                <div className="font-medium text-blue-600">{recommendedTeam.name}</div>
                <div className="text-xs text-muted-foreground">
                  {recommendedTeam.currentBusinessManagers}/{recommendedTeam.maxBusinessManagers} BMs
                </div>
              </div>
            ) : (
              <div>
                <div className="text-red-600 font-medium">No capacity</div>
                <div className="text-xs text-muted-foreground">All teams full</div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      header: "Actions",
      width: 80,
      render: (application: any) => (
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
              <FileText className="h-4 w-4 mr-2" />
              View Documents
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Apps</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
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
                  placeholder="Search applications, clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="document_prep">Document Prep</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new_business">New Business</SelectItem>
                <SelectItem value="ad_account">Ad Account</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredApplications.length} of {stats.total} applications
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

      {/* Applications Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <VirtualizedTable
            data={filteredApplications}
            columns={columns}
            height={600}
            itemHeight={60}
          />
        </CardContent>
      </Card>
    </div>
  );
} 