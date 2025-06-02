"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import useSWR from 'swr'
import { useAuth } from "@/contexts/AuthContext"

interface Organization { /* ... */ }
interface OrganizationContextType { /* ... */ }

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const fetcher = (url: string, token: string | null) => { // Token can be null initially
  if (!token) return Promise.resolve(null); // Don't fetch if no token
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(async res => {
      if (!res.ok) {
        // Handle non-OK responses, maybe return null or throw an error SWR can catch
        // For now, just log and return null to avoid breaking .json() call
        console.error(`Fetcher error for ${url}: ${res.status}`);
        return null;
      }
      const json = await res.json();
      return json;
    });
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizationsState] = useState<Organization[] | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const retrieveToken = async () => {
      if (user && isMounted) {
        try {
          console.log("[OrgContext] User detected, attempting to get ID token.");
          const idToken = await user.getIdToken(true); // Force refresh for freshness
          if (isMounted) {
            console.log("[OrgContext] Token obtained:", idToken ? "Exists" : "Null/Empty");
            setToken(idToken);
          }
        } catch (error) {
          console.error("[OrgContext] Error fetching ID token:", error);
          if (isMounted) setToken(null);
        }
      } else if (isMounted) {
        console.log("[OrgContext] No user or not mounted, setting token to null.");
        setToken(null);
      }
    };
    retrieveToken();
    return () => { 
      console.log("[OrgContext] Unmounting, isMounted = false");
      isMounted = false; 
    };
  }, [user]); // Re-fetch token when user object changes

  const shouldFetch = !!user && !!token && !authLoading; 
  console.log(`[OrgContext] SWR: shouldFetch=${shouldFetch}, user=${!!user}, token=${!!token}, authLoading=${authLoading}`);
  
  const { data, error, isLoading, mutate } = useSWR(
    // Key for SWR now includes the token itself, so it re-fetches if token changes.
    // Or, rely on shouldFetch and keep key simpler if SWR revalidates on shouldFetch change.
    // For safety, passing token in key or using a conditional fetch function for SWR might be better.
    // Simpler: rely on shouldFetch to gate the call.
    shouldFetch ? [`/api/proxy/v1/organizations`, token] : null, 
    ([url, tokenArg]) => fetcher(url, tokenArg as string | null) // Pass token to fetcher
  );
  console.log(`[OrgContext] SWR data:`, data, `isLoading: ${isLoading}, error:`, error);

  // ... (rest of useEffects for setting organizations and currentOrg - ensure they handle data === null from fetcher)
  useEffect(() => {
    if (data === null && !isLoading) { // Handle case where fetcher returns null due to error or no token
        console.log("[OrgContext] Data is null from SWR (fetcher returned null), clearing orgs.");
        setOrganizationsState(undefined);
        setCurrentOrgState(null);
        localStorage.removeItem("adhub_current_org");
        return;
    }
    if (data?.organizations) {
      console.log("[OrgContext] Setting organizations from data.organizations", data.organizations);
      setOrganizationsState(data.organizations);
      // ... (current org logic - keep as is for now, but ensure it handles empty data.organizations gracefully)
    } else if (data && Array.isArray(data)) { // If API returns array directly
      console.log("[OrgContext] Setting organizations from direct data array", data);
      setOrganizationsState(data);
      // ... 
    } else if (!isLoading) {
        console.log("[OrgContext] No organization data from SWR, clearing orgs.");
        setOrganizationsState(undefined);
        setCurrentOrgState(null);
        localStorage.removeItem("adhub_current_org");
    }
  }, [data, isLoading]);

  // ... (other useEffects and setCurrentOrg function, ensure localStorage interaction is safe)
  useEffect(() => {
    if (user === null) {
      console.log("[OrgContext] User is null, clearing org state and localStorage.");
      setOrganizationsState(undefined);
      setCurrentOrgState(null);
      localStorage.removeItem("adhub_current_org");
    }
  }, [user]);

  useEffect(() => {
    if (organizations === undefined || organizations.length === 0) {
      if (!isLoading && token) console.log("[OrgContext] No organizations or empty, clearing currentOrg.");
      setCurrentOrgState(null);
      localStorage.removeItem("adhub_current_org");
      return;
    }
    const stored = localStorage.getItem("adhub_current_org");
    let parsed = null;
    if (stored) { try { parsed = JSON.parse(stored); if (typeof parsed !== "object" || !parsed.id) parsed = null; } catch { parsed = null; } }
    if (!parsed) localStorage.removeItem("adhub_current_org");

    const found = parsed && organizations.find(o => o.id === parsed.id);
    if (found) {
      if (!currentOrg || currentOrg.id !== found.id) {
        console.log("[OrgContext] Setting currentOrg from localStorage if valid and different:", found);
        setCurrentOrgState(found);
      }
    } else {
      if (!currentOrg || currentOrg.id !== organizations[0].id) {
        console.log("[OrgContext] Setting currentOrg to first in list if stored one not found/invalid:", organizations[0]);
        setCurrentOrgState(organizations[0]);
        localStorage.setItem("adhub_current_org", JSON.stringify(organizations[0]));
      }
    }
  }, [organizations, isLoading, token, currentOrg]); // Added currentOrg to dependencies

  useEffect(() => {
    if (currentOrg) {
      console.log("[OrgContext] currentOrg changed, syncing to localStorage:", currentOrg);
      localStorage.setItem("adhub_current_org", JSON.stringify(currentOrg));
    } else {
      // If currentOrg becomes null (e.g., user logs out, no orgs found), remove it from localStorage
      // This case might already be covered by other useEffects, but explicit removal can be good.
      // However, be careful not to trigger loops if this useEffect itself causes currentOrg to change.
      // The current logic seems to primarily set localStorage when currentOrg is truthy.
    }
  }, [currentOrg]);

  const setCurrentOrg = (org: Organization | null) => {
    console.log("[OrgContext] setCurrentOrg called with:", org);
    setCurrentOrgState(org);
    if (org) {
      localStorage.setItem("adhub_current_org", JSON.stringify(org));
    } else {
      localStorage.removeItem("adhub_current_org");
    }
  };

  if (user && (authLoading || (isLoading && !data) )) { // Show loader if auth is loading OR SWR is loading initial org data
    console.log(`[OrgContext] Render: AuthLoading: ${authLoading}, SWR isLoading: ${isLoading}, SWR data: ${!!data}. Returning null (loader expected from AppProviders or parent).`);
    return null; 
  }

  console.log(`[OrgContext] Render: Passing to provider: organizations: ${organizations?.length}, currentOrg: ${currentOrg?.id}, loading: ${isLoading}`);
  return (
    <OrganizationContext.Provider value={{ organizations, setOrganizations: setOrganizationsState, currentOrg, setCurrentOrg, loading: isLoading, error, mutate }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => { /* ... */ }; 