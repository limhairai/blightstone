"use client";

import { useState } from "react";
import useSWR from 'swr';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CreateAccountDialog } from "./create-account-dialog";
import { 
  Plus, 
  Search,
  Filter,
  Building2,
  CreditCard,
  DollarSign,
  Calendar,
  ExternalLink,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AccountProvisioningTable() {
  const { data: bizData, isLoading: isBizLoading } = useSWR('/api/businesses', fetcher);
  const { data: accData, isLoading: isAccLoading } = useSWR('/api/ad-accounts', fetcher);

  const allBusinesses = bizData?.businesses || [];
  const allAccounts = accData?.accounts || [];
  const isLoading = isBizLoading || isAccLoading;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);

  // Filter only approved businesses
  const approvedBusinesses = allBusinesses.filter((business: any) => business.status === "approved" || business.status === "active");

  // Apply search and filters
  const filteredBusinesses = approvedBusinesses.filter((business: any) => {
    const matchesSearch = !searchTerm || business.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    
    if (statusFilter === "with-accounts") {
      matchesStatus = allAccounts.filter((acc: any) => acc.business_id === business.id).length > 0;
    } else if (statusFilter === "without-accounts") {
      matchesStatus = allAccounts.filter((acc: any) => acc.business_id === business.id).length === 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  const getAccountStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const, color: "text-[#34D197]" },
      pending: { label: "Pending", variant: "secondary" as const, color: "text-yellow-600" },
      paused: { label: "Paused", variant: "outline" as const, color: "text-gray-600" },
      error: { label: "Error", variant: "destructive" as const, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleCreateAccount = (business: any) => {
    setSelectedBusiness(business);
    setCreateAccountDialogOpen(true);
  };

  const getTotalSpend = (accounts: any[]) => {
    return accounts.reduce((total: number, acc: any) => total + acc.spent, 0);
  };

  const getTotalBalance = (accounts: any[]) => {
    return accounts.reduce((total: number, acc: any) => total + (acc.balance_cents ? acc.balance_cents / 100 : 0), 0);
  };

  if (isLoading) {
    return <div>Loading account provisioning data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            <SelectItem value="with-accounts">With Ad Accounts</SelectItem>
            <SelectItem value="without-accounts">No Ad Accounts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Businesses Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Ad Accounts</TableHead>
              <TableHead>Total Spend</TableHead>
              <TableHead>Total Balance</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBusinesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No approved businesses found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredBusinesses.map((business: any) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{business.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {business.type || "Other"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {(() => {
                        const businessAccounts = allAccounts.filter((acc: any) => acc.business_id === business.id);
                        return (
                          <>
                            <div className="text-sm font-medium text-foreground">
                              {businessAccounts.length} account{businessAccounts.length !== 1 ? 's' : ''}
                            </div>
                            {businessAccounts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {businessAccounts.slice(0, 2).map((account: any, index: any) => (
                                  <div key={account.id} className="flex items-center gap-1">
                                    {getAccountStatusBadge(account.status)}
                                  </div>
                                ))}
                                {businessAccounts.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{businessAccounts.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        ${(() => {
                          const businessAccounts = allAccounts.filter((acc: any) => acc.business_id === business.id);
                          const totalSpend = businessAccounts.reduce((total: any, acc: any) => total + (acc.spent || 0), 0);
                          return totalSpend.toLocaleString();
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        ${(() => {
                          const businessAccounts = allAccounts.filter((acc: any) => acc.business_id === business.id);
                          const totalBalance = businessAccounts.reduce((total: any, acc: any) => total + (acc.balance_cents ? acc.balance_cents / 100 : 0), 0);
                          return totalBalance.toLocaleString();
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {(() => {
                        const businessAccounts = allAccounts.filter((acc: any) => acc.business_id === business.id);
                        return businessAccounts.length > 0 ? (
                          <span>Recent activity</span>
                        ) : (
                          <span>No activity</span>
                        );
                      })()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateAccount(business)}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Account
                      </Button>
                      
                      {(() => {
                        const businessAccounts = allAccounts.filter((acc: any) => acc.business_id === business.id);
                        return businessAccounts.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Account Dialog */}
      {selectedBusiness && (
        <CreateAccountDialog
          isOpen={createAccountDialogOpen}
          onClose={() => setCreateAccountDialogOpen(false)}
          business={selectedBusiness}
        />
      )}
    </div>
  );
} 