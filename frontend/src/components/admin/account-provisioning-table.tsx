"use client";

import { useState } from "react";
import { useDemoState } from "../../contexts/DemoStateContext";
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

export function AccountProvisioningTable() {
  const { state } = useDemoState();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);

  // Filter only approved businesses
  const approvedBusinesses = state.businesses.filter(business => business.status === "active");

  // Apply search and filters
  const filteredBusinesses = approvedBusinesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.businessType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "with_accounts") {
      matchesStatus = (business.adAccountIds?.length || 0) > 0;
    } else if (statusFilter === "no_accounts") {
      matchesStatus = (business.adAccountIds?.length || 0) === 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  const getAccountStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const, color: "text-green-600" },
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
    return accounts.reduce((total, acc) => total + acc.spent, 0);
  };

  const getTotalBalance = (accounts: any[]) => {
    return accounts.reduce((total, acc) => total + acc.balance, 0);
  };

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
            <SelectItem value="with_accounts">With Ad Accounts</SelectItem>
            <SelectItem value="no_accounts">No Ad Accounts</SelectItem>
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
              filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{business.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {business.businessType || "Other"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {(business.adAccountIds?.length || 0)} account{(business.adAccountIds?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      {(business.adAccountIds?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(business.adAccountIds || []).slice(0, 2).map((accountId: string, index: number) => (
                            <div key={accountId} className="flex items-center gap-1">
                              {getAccountStatusBadge("active")}
                            </div>
                          ))}
                          {(business.adAccountIds?.length || 0) > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{(business.adAccountIds?.length || 0) - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        ${getTotalSpend([]).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        ${getTotalBalance([]).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {(business.adAccountIds?.length || 0) > 0 ? (
                        <span>
                          Recent activity
                        </span>
                      ) : (
                        <span>No activity</span>
                      )}
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
                      
                      {(business.adAccountIds?.length || 0) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                        >
                          <Settings className="h-4 w-4" />
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