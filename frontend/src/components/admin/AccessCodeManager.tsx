'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Plus, Eye, Trash2, RefreshCw, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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
    const message = `🎯 Welcome to Blightstone!

Your access code: ${code}

To get started:
1. Open Telegram
2. Search for @adhubtechbot
3. Send: /start ${code}

🚀 You'll get instant access to your ad account management dashboard!`;

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
    
    return <Badge variant="default">Active</Badge>;
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'admin_invite': return 'Admin Invite';
      case 'group_invite': return 'Group Invite';
      default: return 'User Invite';
    }
  };

  const filteredCodes = accessCodes.filter(code => {
    const matchesSearch = searchTerm === '' || 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeDisplay(code.code_type).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && code.is_active && new Date(code.expires_at) > new Date() && code.current_uses < code.max_uses) ||
      (statusFilter === 'expired' && new Date(code.expires_at) < new Date()) ||
      (statusFilter === 'used_up' && code.current_uses >= code.max_uses) ||
      (statusFilter === 'inactive' && !code.is_active);
    
    const matchesType = typeFilter === 'all' || code.code_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-6 w-6 mr-2" />
        <span>Loading access codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search access codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="used_up">Used Up</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user_invite">User Invite</SelectItem>
              <SelectItem value="group_invite">Group Invite</SelectItem>
              <SelectItem value="admin_invite">Admin Invite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {filteredCodes.length} codes shown
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
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
                      <SelectItem value="user_invite">User Invite</SelectItem>
                      <SelectItem value="group_invite">Group Invite</SelectItem>
                      <SelectItem value="admin_invite">Admin Invite</SelectItem>
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
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Code</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Usage</TableHead>
              <TableHead className="text-muted-foreground">Expires</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {accessCodes.length === 0 ? (
                    <div className="space-y-2">
                      <p>No access codes created yet.</p>
                      <Button 
                        onClick={() => setShowCreateDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        Create Your First Access Code
                      </Button>
                    </div>
                  ) : (
                    'No codes match your filters.'
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredCodes.map((code) => (
                <TableRow key={code.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-medium">
                      {code.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{getTypeDisplay(code.code_type)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(code)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{code.current_uses}</span>
                      <span className="text-muted-foreground">/{code.max_uses}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(code.expires_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInviteMessage(code.code)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deactivateCode(code.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 