"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Interfaces for real data
export interface Organization {
  id: string;
  name: string;
  plan: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  organization_id: string;
  status: 'pending' | 'active' | 'rejected';
  verification: 'pending' | 'verified' | 'rejected';
  industry?: string;
  website?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  business_id: string;
  user_id: string;
  status: 'available' | 'assigned' | 'active' | 'paused';
  balance: number;
  spend_limit: number;
  spend_7d: number;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  invited_by?: string;
  joined_at: string;
  users?: {
    email: string;
    full_name?: string;
  };
}

export interface Application {
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
  user_email?: string;
  user_name?: string;
  business_name?: string;
  organization_name?: string;
}

// State interface
interface ProductionDataState {
  // Data
  organizations: Organization[];
  currentOrganization: Organization | null;
  businesses: Business[];
  adAccounts: AdAccount[];
  transactions: Transaction[];
  teamMembers: TeamMember[];
  applications: Application[];
  
  // Loading states
  loading: {
    organizations: boolean;
    businesses: boolean;
    adAccounts: boolean;
    transactions: boolean;
    teamMembers: boolean;
    applications: boolean;
    actions: boolean;
  };
  
  // Error states
  error: string | null;
}

// Context type
interface ProductionDataContextType {
  state: ProductionDataState;
  
  // Data fetching
  fetchOrganizations: () => Promise<void>;
  fetchBusinesses: (orgId?: string) => Promise<void>;
  fetchAdAccounts: (orgId?: string) => Promise<void>;
  fetchTransactions: (orgId?: string) => Promise<void>;
  fetchTeamMembers: (orgId?: string) => Promise<void>;
  fetchApplications: (orgId?: string) => Promise<void>;
  
  // Organization actions
  switchOrganization: (orgId: string) => void;
  
  // Business actions
  createBusiness: (businessData: Partial<Business>) => Promise<void>;
  updateBusiness: (business: Business) => Promise<void>;
  deleteBusiness: (businessId: string) => Promise<void>;
  
  // Wallet actions
  getWalletBalance: () => number;
  topUpWallet: (amount: number) => Promise<void>;
  
  // Utility
  refresh: () => Promise<void>;
}

const ProductionDataContext = createContext<ProductionDataContextType | undefined>(undefined);

// Initial state
const initialState: ProductionDataState = {
  organizations: [],
  currentOrganization: null,
  businesses: [],
  adAccounts: [],
  transactions: [],
  teamMembers: [],
  applications: [],
  loading: {
    organizations: false,
    businesses: false,
    adAccounts: false,
    transactions: false,
    teamMembers: false,
    applications: false,
    actions: false,
  },
  error: null,
};

// Provider component
export function ProductionDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<ProductionDataState>(initialState);

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    if (!session) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).access_token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Set loading state
  const setLoading = (key: keyof ProductionDataState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value },
    }));
  };

  // Set error state
  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      setLoading('organizations', true);
      setError(null);
      
      const data = await apiCall('/api/organizations');
      
      setState(prev => ({
        ...prev,
        organizations: data.organizations || [],
        currentOrganization: data.organizations?.[0] || null,
      }));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch organizations');
    } finally {
      setLoading('organizations', false);
    }
  };

  // Fetch businesses
  const fetchBusinesses = async (orgId?: string) => {
    try {
      setLoading('businesses', true);
      setError(null);
      
      const organizationId = orgId || state.currentOrganization?.id;
      if (!organizationId) return;
      
      const data = await apiCall(`/api/businesses?organization_id=${organizationId}`);
      
      setState(prev => ({
        ...prev,
        businesses: data.businesses || [],
      }));
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch businesses');
    } finally {
      setLoading('businesses', false);
    }
  };

  // Fetch ad accounts
  const fetchAdAccounts = async (orgId?: string) => {
    try {
      setLoading('adAccounts', true);
      setError(null);
      
      const organizationId = orgId || state.currentOrganization?.id;
      if (!organizationId) return;
      
      const data = await apiCall(`/api/ad-accounts?organization_id=${organizationId}`);
      
      setState(prev => ({
        ...prev,
        adAccounts: data.ad_accounts || [],
      }));
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ad accounts');
    } finally {
      setLoading('adAccounts', false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async (orgId?: string) => {
    try {
      setLoading('transactions', true);
      setError(null);
      
      const organizationId = orgId || state.currentOrganization?.id;
      if (!organizationId) return;
      
      const data = await apiCall(`/api/wallet/transactions?organization_id=${organizationId}`);
      
      setState(prev => ({
        ...prev,
        transactions: data.transactions || [],
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
    } finally {
      setLoading('transactions', false);
    }
  };

  // Fetch team members
  const fetchTeamMembers = async (orgId?: string) => {
    try {
      setLoading('teamMembers', true);
      setError(null);
      
      const organizationId = orgId || state.currentOrganization?.id;
      if (!organizationId) return;
      
      const data = await apiCall(`/api/organizations/${organizationId}/members`);
      
      setState(prev => ({
        ...prev,
        teamMembers: data.members || [],
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch team members');
    } finally {
      setLoading('teamMembers', false);
    }
  };

  // Fetch applications
  const fetchApplications = async (orgId?: string) => {
    try {
      setLoading('applications', true);
      setError(null);
      
      const data = await apiCall('/api/applications');
      
      setState(prev => ({
        ...prev,
        applications: data || [],
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch applications');
    } finally {
      setLoading('applications', false);
    }
  };

  // Switch organization
  const switchOrganization = (orgId: string) => {
    const organization = state.organizations.find(org => org.id === orgId);
    if (organization) {
      setState(prev => ({
        ...prev,
        currentOrganization: organization,
        // Clear data when switching organizations
        businesses: [],
        adAccounts: [],
        transactions: [],
        teamMembers: [],
        applications: [],
      }));
      
      // Fetch new organization data
      fetchBusinesses(orgId);
      fetchAdAccounts(orgId);
      fetchTransactions(orgId);
      fetchTeamMembers(orgId);
      fetchApplications(orgId);
      
      toast.success(`Switched to ${organization.name}`);
    }
  };

  // Create business
  const createBusiness = async (businessData: Partial<Business>) => {
    try {
      setLoading('actions', true);
      setError(null);
      
      const data = await apiCall('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(businessData),
      });
      
      // Refresh businesses list
      await fetchBusinesses();
      
      toast.success('Business created successfully');
    } catch (error) {
      console.error('Error creating business:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create business';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading('actions', false);
    }
  };

  // Update business
  const updateBusiness = async (business: Business) => {
    try {
      setLoading('actions', true);
      setError(null);
      
      await apiCall(`/api/businesses/${business.id}`, {
        method: 'PUT',
        body: JSON.stringify(business),
      });
      
      // Update local state
      setState(prev => ({
        ...prev,
        businesses: prev.businesses.map(b => b.id === business.id ? business : b),
      }));
      
      toast.success('Business updated successfully');
    } catch (error) {
      console.error('Error updating business:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update business';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading('actions', false);
    }
  };

  // Delete business
  const deleteBusiness = async (businessId: string) => {
    try {
      setLoading('actions', true);
      setError(null);
      
      await apiCall(`/api/businesses/${businessId}`, {
        method: 'DELETE',
      });
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        businesses: prev.businesses.filter(b => b.id !== businessId),
      }));
      
      toast.success('Business deleted successfully');
    } catch (error) {
      console.error('Error deleting business:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete business';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading('actions', false);
    }
  };

  // Get wallet balance
  const getWalletBalance = (): number => {
    return state.currentOrganization?.balance || 0;
  };

  // Top up wallet
  const topUpWallet = async (amount: number) => {
    try {
      setLoading('actions', true);
      setError(null);
      
      const organizationId = state.currentOrganization?.id;
      if (!organizationId) throw new Error('No organization selected');
      
      await apiCall('/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: organizationId,
          amount,
        }),
      });
      
      // Refresh organization data
      await fetchOrganizations();
      await fetchTransactions();
      
      toast.success(`Added $${amount.toLocaleString()} to wallet`);
    } catch (error) {
      console.error('Error topping up wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to top up wallet';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading('actions', false);
    }
  };

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      fetchOrganizations(),
      fetchBusinesses(),
      fetchAdAccounts(),
      fetchTransactions(),
      fetchTeamMembers(),
      fetchApplications(),
    ]);
  };

  // Load initial data when session is available
  useEffect(() => {
    if (session) {
      fetchOrganizations();
    }
  }, [session]);

  // Load organization-specific data when current organization changes
  useEffect(() => {
    if (state.currentOrganization?.id) {
      fetchBusinesses();
      fetchAdAccounts();
      fetchTransactions();
      fetchTeamMembers();
      fetchApplications();
    }
  }, [state.currentOrganization?.id]);

  const value: ProductionDataContextType = {
    state,
    fetchOrganizations,
    fetchBusinesses,
    fetchAdAccounts,
    fetchTransactions,
    fetchTeamMembers,
    fetchApplications,
    switchOrganization,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getWalletBalance,
    topUpWallet,
    refresh,
  };

  return (
    <ProductionDataContext.Provider value={value}>
      {children}
    </ProductionDataContext.Provider>
  );
}

// Hook to use the context
export function useProductionData() {
  const context = useContext(ProductionDataContext);
  if (context === undefined) {
    throw new Error('useProductionData must be used within a ProductionDataProvider');
  }
  return context;
} 