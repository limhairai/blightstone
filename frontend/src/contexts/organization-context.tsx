"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import useSWR from 'swr'
import { useAuth } from "./AuthContext"

export interface Organization {
  id: string
  name: string
  avatar?: string
  role?: string
  planId?: string
}

interface OrganizationContextType {
  organizations: Organization[] | undefined
  setOrganizations: (orgs: Organization[]) => void
  currentOrg: Organization | null
  setCurrentOrg: (org: Organization) => void
  loading: boolean
  error?: any
  mutate: (data?: any) => Promise<any>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// The fetcher now expects the token as the second argument in the array passed to SWR
const fetcher = (url: string, token: string | null | undefined) => {
  if (!token) {
    return Promise.reject(new Error("No token provided"));
  }
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(async res => {
      if (!res.ok) {
        const errorInfo = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorInfo.detail || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      return json;
    });
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading: authLoading } = useAuth(); // Added session
  
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizationsState] = useState<Organization[] | undefined>(undefined);

  // User and session?.access_token must be present to fetch, and auth should not be loading.
  const accessToken = session?.access_token;
  const shouldFetch = !!user && !!accessToken && !authLoading;
  
  const { data, error, isLoading, mutate } = useSWR(
    // Pass accessToken directly in the SWR key array if shouldFetch is true
    shouldFetch ? ["/api/proxy/v1/organizations", accessToken] : null,
    ([url, tokenForFetcher]) => fetcher(url, tokenForFetcher) // SWR passes the key array elements as arguments
  );

  // Set organizations when data is fetched
  useEffect(() => {
    if (data?.organizations) {
      setOrganizationsState(data.organizations);
      if (data.organizations.length > 0) {
        setCurrentOrgState(data.organizations[0]);
        localStorage.setItem("adhub_current_org", JSON.stringify(data.organizations[0]));
      } else {
        setCurrentOrgState(null);
        localStorage.removeItem("adhub_current_org");
      }
    } else if (data && Array.isArray(data)) { // Handle if API returns array directly
      setOrganizationsState(data);
      if (data.length > 0) {
        setCurrentOrgState(data[0]);
        localStorage.setItem("adhub_current_org", JSON.stringify(data[0]));
      } else {
        setCurrentOrgState(null);
        localStorage.removeItem("adhub_current_org");
      }
    }
  }, [data]);

  // Clear orgs/currentOrg if user is logged out (user becomes null)
  useEffect(() => {
    if (user === null) { // This indicates user is explicitly logged out
      setOrganizationsState(undefined);
      setCurrentOrgState(null);
      localStorage.removeItem("adhub_current_org");
    }
  }, [user]);

  // Initialize or update currentOrg from localStorage or default to first org
  useEffect(() => {
    if (organizations === undefined || organizations.length === 0) {
      setCurrentOrgState(null);
      // No need to remove from localStorage here as it will be handled if organizations are empty
      return;
    }

    const stored = localStorage.getItem("adhub_current_org");
    let parsedOrg: Organization | null = null;
    if (stored) {
      try {
        parsedOrg = JSON.parse(stored) as Organization;
        if (typeof parsedOrg !== "object" || !parsedOrg.id || !organizations.find(o => o.id === parsedOrg?.id)) {
          parsedOrg = null; // Invalid or not in current list
        }
      } catch {
        parsedOrg = null;
      }
    }

    const orgToSet = parsedOrg || organizations[0];
    setCurrentOrgState(orgToSet);
    localStorage.setItem("adhub_current_org", JSON.stringify(orgToSet));

  }, [organizations]); // Re-run when organizations list changes

  // Sync currentOrg to localStorage when it changes by other means (e.g., direct call to setCurrentOrg)
  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem("adhub_current_org", JSON.stringify(currentOrg));
    } else {
      // If currentOrg becomes null (e.g. last org deleted), remove from localStorage
      localStorage.removeItem("adhub_current_org");
    }
  }, [currentOrg]);

  const setCurrentOrg = (org: Organization | null) => {
    setCurrentOrgState(org);
    // localStorage update is handled by the useEffect above
  };
  
  // Consider what to show during authLoading or SWR isLoading
  // For now, returning null if authLoading is true to let AppProviders handle global loading state.
  // If isLoading for SWR is true but user is authenticated, specific loading UI might be desired here or in consuming components.
  if (authLoading) { 
    return null; 
  }

  return (
    <OrganizationContext.Provider value={{ organizations, setOrganizations: setOrganizationsState, currentOrg, setCurrentOrg, loading: isLoading, error, mutate }}>
      {children}
    </OrganizationContext.Provider>
  )
}

// To install SWR in China, use:
// npm install swr --registry=https://registry.npmmirror.com

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext)
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider")
  return ctx
} 