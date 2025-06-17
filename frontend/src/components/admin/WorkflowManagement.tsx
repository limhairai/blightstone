import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

interface Application {
  id: string;
  clientName: string;
  businessName: string;
  stage: 'received' | 'document_prep' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  assignedRep: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  slaDeadline: string;
  createdAt: string;
  lastUpdated: string;
  provider: string;
  notes: string[];
  documents: { name: string; status: 'pending' | 'complete' | 'missing' }[];
}

interface Rep {
  id: string;
  name: string;
  activeApplications: number;
  capacity: number;
  efficiency: number;
  status: 'online' | 'busy' | 'offline';
}

interface WorkflowManagementProps {
  applications: Application[];
  reps: Rep[];
  loading?: boolean;
}

export function WorkflowManagement({ applications, reps, loading = false }: WorkflowManagementProps) {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedRep, setSelectedRep] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  
  const { searchTerm, debouncedTerm, setSearchTerm } = useDebouncedSearch();

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = app.clientName.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
                           app.businessName.toLowerCase().includes(debouncedTerm.toLowerCase());
      const matchesStage = selectedStage === 'all' || app.stage === selectedStage;
      const matchesRep = selectedRep === 'all' || app.assignedRep === selectedRep;
      const matchesPriority = priorityFilter === 'all' || app.priority === priorityFilter;
      
      return matchesSearch && matchesStage && matchesRep && matchesPriority;
    });
  }, [applications, debouncedTerm, selectedStage, selectedRep, priorityFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter(app => !['approved', 'rejected'].includes(app.stage)).length;
    const overdue = applications.filter(app => new Date(app.slaDeadline) < new Date()).length;
    const avgProcessingTime = 2.3; // Mock data - calculate from actual data
    
    return { total, inProgress, overdue, avgProcessingTime };
  }, [applications]);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'received': return <Clock className="h-3 w-3 text-blue-600" />;
      case 'document_prep': return <User className="h-3 w-3 text-yellow-600" />;
      case 'submitted': return <ArrowRight className="h-3 w-3 text-purple-600" />;
      case 'under_review': return <Eye className="h-3 w-3 text-orange-600" />;
      case 'approved': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'rejected': return <XCircle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatus = (deadline: string) => {
    const now = new Date();
    const slaDate = new Date(deadline);
    const hoursRemaining = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) return { status: 'overdue', color: 'text-red-600', text: 'Overdue' };
    if (hoursRemaining < 2) return { status: 'urgent', color: 'text-orange-600', text: `${Math.ceil(hoursRemaining)}h left` };
    if (hoursRemaining < 24) return { status: 'warning', color: 'text-yellow-600', text: `${Math.ceil(hoursRemaining)}h left` };
    return { status: 'ok', color: 'text-green-600', text: `${Math.ceil(hoursRemaining / 24)}d left` };
  };

  // Compact application row - optimized for high density
  const ApplicationRow = ({ app }: { app: Application }) => {
    const slaStatus = getSLAStatus(app.slaDeadline);
    
    return (
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 hover:bg-muted/30 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input 
            type="checkbox" 
            className="h-3 w-3"
            checked={selectedApplications.has(app.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedApplications);
              if (e.target.checked) {
                newSelected.add(app.id);
              } else {
                newSelected.delete(app.id);
              }
              setSelectedApplications(newSelected);
            }}
          />
          {getStageIcon(app.stage)}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{app.businessName}</div>
            <div className="text-muted-foreground truncate">{app.clientName}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <Badge className={getPriorityColor(app.priority)}>
            {app.priority}
          </Badge>
          
          <div className="text-center">
            <div className="font-medium">{app.assignedRep || 'Unassigned'}</div>
            <div className="text-muted-foreground">rep</div>
          </div>
          
          <div className="text-center">
            <div className={`font-medium ${slaStatus.color}`}>
              {slaStatus.text}
            </div>
            <div className="text-muted-foreground">SLA</div>
          </div>
          
          <div className="text-center">
            <div className="font-medium">{app.provider}</div>
            <div className="text-muted-foreground">provider</div>
          </div>
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Eye className="h-3 w-3" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold">{metrics.total}</div>
            <div className="text-muted-foreground">Total Applications</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{metrics.inProgress}</div>
            <div className="text-muted-foreground">In Progress</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{metrics.overdue}</div>
            <div className="text-muted-foreground">Overdue</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{metrics.avgProcessingTime}d</div>
            <div className="text-muted-foreground">Avg Processing</div>
          </div>
        </Card>
      </div>

      {/* Rep Status Dashboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rep Workload</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reps.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    rep.status === 'online' ? 'bg-green-500' :
                    rep.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">{rep.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rep.activeApplications}/{rep.capacity} • {(rep.efficiency * 100).toFixed(0)}% efficiency
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {Math.round((rep.activeApplications / rep.capacity) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">capacity</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>
          
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="document_prep">Doc Prep</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedRep} onValueChange={setSelectedRep}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {reps.map(rep => (
                <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium">{selectedApplications.size} selected</span>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Assign Rep
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Update Priority
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Bulk Submit
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Export Selected
          </Button>
        </div>
      )}

      {/* Applications Queue */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Application Queue ({filteredApplications.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{filteredApplications.filter(app => getSLAStatus(app.slaDeadline).status === 'overdue').length} overdue</span>
              <span>•</span>
              <span>{filteredApplications.filter(app => app.priority === 'urgent').length} urgent</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-auto">
            {filteredApplications.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 