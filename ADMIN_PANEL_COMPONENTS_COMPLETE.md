# AdHub Admin Panel - Complete Components Export

## AccessCodeManager Component

```tsx
// frontend/src/components/admin/AccessCodeManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Plus, Eye, Trash2, RefreshCw, Users, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AccessCode {
  id: string;
  code: string;
  code_type: 'user_invite' | 'group_invite' | 'admin_invite';
  max_uses: number;
  current_uses: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  organization_id: string;
}

interface AccessCodeManagerProps {
  organizationId: string;
  organizationName: string;
}

export default function AccessCodeManager({ organizationId, organizationName }: AccessCodeManagerProps) {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    code_type: 'user_invite' as const,
    max_uses: 1,
    expires_hours: 24
  });

  useEffect(() => {
    fetchAccessCodes();
  }, [organizationId]);

  const fetchAccessCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/access-codes?organization_id=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAccessCodes(data);
      } else {
        toast.error('Failed to load access codes');
      }
    } catch (error) {
      console.error('Error fetching access codes:', error);
      toast.error('Failed to load access codes');
    } finally {
      setLoading(false);
    }
  };

  const createAccessCode = async () => {
    try {
      const response = await fetch('/api/access-codes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          ...createForm
        })
      });

      if (response.ok) {
        const newCode = await response.json();
        setAccessCodes(prev => [newCode, ...prev]);
        setShowCreateDialog(false);
        setCreateForm({ code_type: 'user_invite', max_uses: 1, expires_hours: 24 });
        toast.success('Access code created successfully!');
      } else {
        toast.error('Failed to create access code');
      }
    } catch (error) {
      console.error('Error creating access code:', error);
      toast.error('Failed to create access code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyInviteMessage = (code: string) => {
    const message = \`🎯 Welcome to AdHub!

Your access code: \${code}

To get started:
1. Open Telegram
2. Search for @adhubtechbot
3. Send: /start \${code}

🚀 You'll get instant access to your ad account management dashboard!\`;

    navigator.clipboard.writeText(message);
    toast.success('Invitation message copied!');
  };

  const deactivateCode = async (codeId: string) => {
    try {
      const response = await fetch(`/api/access-codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setAccessCodes(prev => prev.filter(code => code.id !== codeId));
        toast.success('Access code deactivated');
      } else {
        toast.error('Failed to deactivate code');
      }
    } catch (error) {
      console.error('Error deactivating code:', error);
      toast.error('Failed to deactivate code');
    }
  };

  const getStatusBadge = (code: AccessCode) => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (code.current_uses >= code.max_uses) {
      return <Badge variant="outline">Used Up</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500">Active</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_invite': return '👑';
      case 'group_invite': return '👥';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-6 w-6" />
            <span className="ml-2">Loading access codes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access Code Manager</h2>
          <p className="text-gray-600">Generate secure access codes for Telegram bot access</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Access Code
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Access Code</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="code_type">Code Type</Label>
                <Select
                  value={createForm.code_type}
                  onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, code_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_invite">👤 User Invite</SelectItem>
                    <SelectItem value="group_invite">👥 Group Invite</SelectItem>
                    <SelectItem value="admin_invite">👑 Admin Invite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="max_uses">Maximum Uses</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={createForm.max_uses}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="expires_hours">Expires In (Hours)</Label>
                <Select
                  value={createForm.expires_hours.toString()}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, expires_hours: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="72">3 Days</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={createAccessCode} className="flex-1">
                  Create Code
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Access Codes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accessCodes.map((code) => (
          <Card key={code.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(code.code_type)}</span>
                  <CardTitle className="text-sm font-medium">
                    {code.code_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                </div>
                {getStatusBadge(code)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Access Code */}
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-center">
                <div className="text-lg font-bold tracking-wider">{code.code}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(code.code)}
                  className="mt-1 h-8 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Code
                </Button>
              </div>
              
              {/* Usage Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{code.current_uses}/{code.max_uses} uses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {new Date(code.expires_at) > new Date() 
                      ? `Expires ${new Date(code.expires_at).toLocaleDateString()}`
                      : 'Expired'
                    }
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInviteMessage(code.code)}
                  className="flex-1 text-xs"
                >
                  Copy Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deactivateCode(code.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {accessCodes.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No access codes yet</h3>
                <p className="text-sm">Create your first access code to start inviting users.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

## ApplicationsReviewTable Component

```tsx
// frontend/src/components/admin/applications-review-table.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ApplicationReviewDialog } from "./application-review-dialog";
import { ApplicationDetailsDialog } from "./application-details-dialog";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  ExternalLink,
  Building2,
  Calendar,
  Globe,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Application {
  id: string;
  user_id: string;
  organization_id: string;
  business_id: string;
  account_name: string;
  spend_limit: number;
  landing_page_url?: string;
  facebook_page_url?: string;
  campaign_description?: string;
  notes?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  assigned_account_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  businesses?: {
    name: string;
    organization_id: string;
  };
  organizations?: {
    name: string;
  };
  users?: {
    email: string;
    full_name: string;
  };
}

export function ApplicationsReviewTable() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchApplications = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/applications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [session, statusFilter]);

  const filteredApplications = applications.filter((application) => {
    const matchesSearch = 
      application.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.businesses?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.users?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      under_review: { label: "Under Review", variant: "default" as const, icon: AlertTriangle, color: "text-orange-600" },
      approved: { label: "Approved", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleReviewApplication = (application: Application) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsDialogOpen(true);
  };

  const handleApproveApplication = async (applicationId: string, notes?: string) => {
    if (!session) return;

    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
        body: JSON.stringify({
          action: 'approve',
          application_id: applicationId,
          admin_notes: notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to approve application');
      }

      toast.success('Application approved successfully');
      setReviewDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    if (!session) return;

    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).access_token}`,
        },
        body: JSON.stringify({
          action: 'reject',
          application_id: applicationId,
          rejection_reason: reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reject application');
      }

      toast.success('Application rejected');
      setReviewDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject application');
    }
  };

  const handleRequestMoreInfo = async (applicationId: string, message: string) => {
    toast.info('Request more info feature coming soon');
    setReviewDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No applications found matching your search.' : 'No applications found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{application.account_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${application.spend_limit.toLocaleString()} spend limit
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {application.businesses?.name || 'Unknown Business'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.organizations?.name || 'Unknown Organization'}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {application.users?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.users?.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {formatDistanceToNow(new Date(application.submitted_at), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {application.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewApplication(application)}
                          className="h-8 px-3 text-blue-600 hover:text-blue-700"
                        >
                          Review
                        </Button>
                      )}
                      
                      {application.assigned_account_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          title="View assigned account"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      {selectedApplication && (
        <ApplicationReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          application={selectedApplication}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
          onRequestMoreInfo={handleRequestMoreInfo}
        />
      )}

      {/* Details Dialog */}
      {selectedApplication && (
        <ApplicationDetailsDialog
          isOpen={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          application={selectedApplication}
        />
      )}
    </div>
  );
}
```

## WorkflowManagement Component

```tsx
// frontend/src/components/admin/WorkflowManagement.tsx
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

  const metrics = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter(app => !['approved', 'rejected'].includes(app.stage)).length;
    const overdue = applications.filter(app => new Date(app.slaDeadline) < new Date()).length;
    const avgProcessingTime = 2.3;
    
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
```

This complete components export includes all the major admin panel components with full functionality, TypeScript interfaces, and styling. You can now easily port these into v0 for redesign! 