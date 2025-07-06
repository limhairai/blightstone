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
    const message = `🎯 Welcome to AdHub!

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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold">
                  {accessCodes.filter(code => {
                    const now = new Date();
                    const expiresAt = new Date(code.expires_at);
                    return code.is_active && expiresAt > now && code.current_uses < code.max_uses;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Redemptions</p>
                <p className="text-2xl font-bold">
                  {accessCodes.reduce((sum, code) => sum + code.current_uses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Expired Codes</p>
                <p className="text-2xl font-bold">
                  {accessCodes.filter(code => new Date(code.expires_at) < new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Codes</p>
                <p className="text-2xl font-bold">{accessCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Access Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {accessCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No access codes created yet.</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
                variant="outline"
              >
                Create Your First Access Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accessCodes.map((code) => (
                <div key={code.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getTypeIcon(code.code_type)}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-lg font-bold">
                            {code.code}
                          </code>
                          {getStatusBadge(code)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {code.code_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                          Used {code.current_uses}/{code.max_uses} times • 
                          Expires {new Date(code.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteMessage(code.code)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deactivateCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Access Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Create an access code</p>
                <p className="text-sm text-gray-600">Choose the type and expiration settings</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Share with your team</p>
                <p className="text-sm text-gray-600">Copy the invitation message and send to users</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Users redeem on Telegram</p>
                <p className="text-sm text-gray-600">They send <code>/start CODE</code> to @adhubtechbot</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</div>
              <div>
                <p className="font-medium">Instant access granted</p>
                <p className="text-sm text-gray-600">Users get full access to their organization&apos;s data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 