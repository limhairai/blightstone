"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useOrganization } from "@/components/organization-context";

interface WalletContextType {
  walletBalance: number;
  adAccounts: any[];
  transactions: any[];
  loading: boolean;
  error: string;
  refresh: () => void;
  txPage: number;
  setTxPage: (page: number) => void;
  txPageSize: number;
  txTotal: number;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { currentOrg } = useOrganization();
  const [walletBalance, setWalletBalance] = useState(0);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(20);
  const [txTotal, setTxTotal] = useState(0);

  const fetchData = async () => {
    if (!currentOrg?.id) return;
    const token = localStorage.getItem("adhub_token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      // Fetch org document for balance
      const orgRes = await fetch(`/api/proxy/v1/organizations/${currentOrg.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const orgData = await orgRes.json();
      setWalletBalance(orgData.balance || 0);
      const adRes = await fetch(`/api/proxy/v1/ad-accounts?orgId=${currentOrg.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const adData = await adRes.json();
      setAdAccounts(adData.adAccounts || []);
      const txRes = await fetch(`/api/proxy/v1/transactions?orgId=${currentOrg.id}&limit=${txPageSize}&offset=${(txPage-1)*txPageSize}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        setTxTotal(txData.total || 0);
      } else if (txRes.status === 404) {
        setTransactions([]);
        setTxTotal(0);
      } else {
        setError("Failed to fetch transactions");
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch wallet data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentOrg?.id) return;
    const token = localStorage.getItem("adhub_token");
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, txPage]);

  const value: WalletContextType = {
    walletBalance,
    adAccounts,
    transactions,
    loading,
    error,
    refresh: fetchData,
    txPage,
    setTxPage,
    txPageSize,
    txTotal,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}; 