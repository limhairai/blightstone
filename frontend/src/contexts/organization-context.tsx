"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import useSWR from 'swr'
import { useAuth } from "@/contexts/AuthContext"

interface Organization {
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

const fetcher = (url: string, token: string) => {
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(async res => {
      const json = await res.json();
      return json;
    });
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  
  const [token, setToken] = useState<string | null>(null);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizationsState] = useState<Organization[] | undefined>(undefined);

  // Get Firebase ID token for API auth
  useEffect(() => {
    let isMounted = true;
    const getToken = async () => {
      if (user) {
        const idToken = await user.getIdToken();
        if (isMounted) setToken(idToken);
      } else {
        setToken(null);
      }
    };
    getToken();
    return () => { isMounted = false; };
  }, [user]);

  // Only fetch orgs if user and token are present
  const shouldFetch = !!user && !!token && !authLoading;
  
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ["/api/proxy/v1/organizations", token] : null,
    ([url, token]) => fetcher(url, token)
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
    } else if (data && Array.isArray(data)) {
      setOrganizationsState(data);
      if (data.length > 0) {
        setCurrentOrgState(data[0]);
        localStorage.setItem("adhub_current_org", JSON.stringify(data[0]));
      } else {
        setCurrentOrgState(null);
        localStorage.removeItem("adhub_current_org");
      }
    }
    // Do NOT clear orgs/currentOrg here if data is undefined!
  }, [data]);

  // Only clear orgs/currentOrg if user is actually logged out
  useEffect(() => {
    if (user === null) {
      setOrganizationsState(undefined);
      setCurrentOrgState(null);
      localStorage.removeItem("adhub_current_org");
    }
  }, [user]);

  // On orgs fetch, set currentOrg from localStorage if valid, else default to first org
  useEffect(() => {
    if (organizations === undefined || organizations.length === 0) {
      setCurrentOrgState(null);
      localStorage.removeItem("adhub_current_org");
      return;
    }
    // Try to get from localStorage
    const stored = localStorage.getItem("adhub_current_org");
    let parsed = null;
    if (stored) {
      try {
        parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || !parsed.id) {
          localStorage.removeItem("adhub_current_org");
          parsed = null;
        }
      } catch {
        localStorage.removeItem("adhub_current_org");
      }
    }
    // If the stored org is in the new orgs array, use it; otherwise, use the first org
    const found = parsed && organizations.find(o => o.id === parsed.id);
    if (found) {
      setCurrentOrgState(found);
      localStorage.setItem("adhub_current_org", JSON.stringify(found));
    } else {
      setCurrentOrgState(organizations[0]);
      localStorage.setItem("adhub_current_org", JSON.stringify(organizations[0]));
    }
  }, [organizations]);

  // Sync currentOrg to localStorage
  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem("adhub_current_org", JSON.stringify(currentOrg));
    }
  }, [currentOrg]);

  // Set currentOrg and sync to localStorage
  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem("adhub_current_org", JSON.stringify(org));
  };

  if (user && (authLoading || isLoading)) {
    return null; // Providers will show loader
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